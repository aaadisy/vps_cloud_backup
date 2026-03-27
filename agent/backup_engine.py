import os
import time
import logging
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class BackupEventHandler(FileSystemEventHandler):
    def __init__(self, engine, root_path):
        self.engine = engine
        self.root_path = root_path

    def on_modified(self, event):
        if not event.is_directory:
            self.engine.queue_file(event.src_path, self.root_path)

    def on_created(self, event):
        if not event.is_directory:
            self.engine.queue_file(event.src_path, self.root_path)

class BackupEngine:
    def __init__(self, api_client):
        self.api_client = api_client
        self.is_running = False
        self.paused = False
        self.current_job_id = None
        self.stats = {"processed_files": 0, "processed_size": 0}
        self.observer = None
        self.watchers = []

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

    def queue_file(self, file_path, root_path):
        # Immediate upload on change
        try:
            if not self.current_job_id:
                # Create a session-less or background job if needed
                # For now let's just upload it directly
                pass 
            
            rel_path = os.path.relpath(os.path.dirname(file_path), root_path)
            file_name = os.path.basename(file_path)
            file_size = os.path.getsize(file_path)
            
            if self.api_client.upload_file(file_path, rel_path):
                 # We'll use a generic job ID if available or just save metadata
                 # Let's start a generic "Real-time Sync" job on server
                 self.api_client.save_file_metadata(self.current_job_id, file_name, file_path, rel_path, file_size)
                 self.stats["processed_files"] += 1
                 self.stats["processed_size"] += file_size
                 logging.info(f"REAL-TIME SYNC: {file_name} updated.")
        except Exception as e:
            logging.error(f"Sync error: {e}")

    def start_backup(self, paths):
        # Keep old manual method but wrap it
        self.is_running = True
        job_res = self.api_client.start_backup("manual")
        if job_res:
             self.current_job_id = job_res.get('id')
             # Normal scan
             for p in paths:
                 self._scan_folder(p)
        self.is_running = False

    def _scan_folder(self, root_path):
        if not os.path.exists(root_path): return
        for root, dirs, files in os.walk(root_path):
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(root, root_path)
                file_size = os.path.getsize(file_path)
                if self.api_client.upload_file(file_path, rel_path):
                    self.api_client.save_file_metadata(self.current_job_id, file, file_path, rel_path, file_size)
                    self.stats["processed_files"] += 1
                    self.stats["processed_size"] += file_size

    def stop(self):
        if self.observer: self.observer.stop()
        self.is_running = False
