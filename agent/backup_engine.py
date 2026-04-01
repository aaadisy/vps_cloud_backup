import os
import time
import logging
import hashlib
import threading
import queue
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class BackupEventHandler(FileSystemEventHandler):
    def __init__(self, engine, root_path):
        self.engine = engine
        self.root_path = root_path

    def on_modified(self, event):
        if not event.is_directory:
            self.engine.add_to_sync_queue(event.src_path, self.root_path, "modified")

    def on_created(self, event):
        if not event.is_directory:
            self.engine.add_to_sync_queue(event.src_path, self.root_path, "created")

    def on_deleted(self, event):
        # Notify about deletion (optional but requested)
        self.engine.add_to_sync_queue(event.src_path, self.root_path, "deleted")

class BackupEngine:
    def __init__(self, api_client):
        self.api_client = api_client
        self.is_running = False
        self.paused = False
        self.current_job_id = None
        self.stats = {"processed_files": 0, "processed_size": 0}
        self.observer = None
        self.watchers = []
        self._uploaded_cache = {}
        
        # Async Upload Queue
        self.sync_queue = queue.Queue()
        self.worker_thread = threading.Thread(target=self._upload_worker, daemon=True)
        self.worker_thread.start()

    def start_realtime_sync(self, paths):
        if self.observer:
            self.observer.stop()
            self.observer.join()
        
        self.observer = Observer()
        for p in paths:
            if os.path.exists(p):
                handler = BackupEventHandler(self, p)
                self.observer.schedule(handler, p, recursive=True)
                logging.info(f"Real-time monitoring started for: {p}")
        
        self.observer.start()

    def add_to_sync_queue(self, file_path, root_path, action):
        self.sync_queue.put((file_path, root_path, action))

    def _upload_worker(self):
        while True:
            try:
                file_path, root_path, action = self.sync_queue.get()
                if action == "deleted":
                    self._handle_deletion(file_path, root_path)
                else:
                    self._process_file_sync(file_path, root_path)
                self.sync_queue.task_done()
            except Exception as e:
                logging.error(f"Worker Error: {e}")

    def get_file_hash(self, file_path):
        try:
            sha256_hash = hashlib.sha256()
            with open(file_path,"rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            return sha256_hash.hexdigest()
        except: return None

    def _process_file_sync(self, file_path, root_path):
        try:
            if not os.path.exists(file_path): return
            
            # Deduplication
            file_hash = self.get_file_hash(file_path)
            if not file_hash: return
            if self._uploaded_cache.get(file_path) == file_hash:
                return 

            if not self.current_job_id:
                job_res = self.api_client.start_backup("sync_realtime")
                if job_res:
                    self.current_job_id = job_res.get('id')

            # Path mapping to maintain structure: /root_folder_name/sub_dirs/file.txt
            root_name = os.path.basename(root_path.rstrip('\\/'))
            rel_dir = os.path.relpath(os.path.dirname(file_path), root_path)
            
            # Join root name with relative directory path
            if rel_dir == '.':
                cloud_sub_path = root_name
            else:
                cloud_sub_path = os.path.join(root_name, rel_dir)

            file_name = os.path.basename(file_path)
            file_size = os.path.getsize(file_path)
            
            logging.info(f"Syncing {file_name} to cloud folder: {cloud_sub_path}")
            
            if self.api_client.upload_file(file_path, cloud_sub_path):
                 self.api_client.save_file_metadata(self.current_job_id, file_name, file_path, cloud_sub_path, file_size)
                 self._uploaded_cache[file_path] = file_hash
                 self.stats["processed_files"] += 1
                 self.stats["processed_size"] += file_size
        except Exception as e:
            logging.error(f"Sync error for {file_path}: {e}")

    def _handle_deletion(self, file_path, root_path):
        logging.info(f"File DELETED locally: {file_path}. (Server cleanup could be triggered here)")
        # In a more advanced version, we'd send a DELETE request to API
        pass

    def start_backup(self, paths):
        # Manual scan (initial sync)
        self.is_running = True
        job_res = self.api_client.start_backup("manual")
        if job_res:
             self.current_job_id = job_res.get('id')
             for p in paths:
                 self._scan_folder(p)
        self.is_running = False

    def _scan_folder(self, root_path):
        if not os.path.exists(root_path): return
        root_name = os.path.basename(root_path.rstrip('\\/'))
        
        for root, dirs, files in os.walk(root_path):
            for file in files:
                file_path = os.path.join(root, file)
                
                # Check cache first
                file_hash = self.get_file_hash(file_path)
                if file_hash and self._uploaded_cache.get(file_path) == file_hash:
                     continue

                rel_dir = os.path.relpath(root, root_path)
                if rel_dir == '.':
                    cloud_sub_path = root_name
                else:
                    cloud_sub_path = os.path.join(root_name, rel_dir)
                    
                file_size = os.path.getsize(file_path)
                if self.api_client.upload_file(file_path, cloud_sub_path):
                    self.api_client.save_file_metadata(self.current_job_id, file, file_path, cloud_sub_path, file_size)
                    self._uploaded_cache[file_path] = file_hash
                    self.stats["processed_files"] += 1
                    self.stats["processed_size"] += file_size

    def stop(self):
        if self.observer: self.observer.stop()
        self.is_running = False

    def pause(self): self.paused = True
    def resume(self): self.paused = False

