import os
import time
import logging

class BackupEngine:
    def __init__(self, api_client):
        self.api_client = api_client
        self.is_running = False
        self.paused = False
        self.current_job_id = None
        self.stats = {}

    def start_backup(self, paths):
        logging.info(f"Starting backup for paths: {paths}")
        self.is_running = True
        self.stats = {"processed_files": 0, "processed_size": 0, "total_files": 100} # Placeholder total
        
        # 1. Start job in API
        job_res = self.api_client.start_backup("manual")
        if not job_res:
             logging.error("Failed to start backup job on server")
             return
             
        self.current_job_id = job_res.get('id')
        logging.info(f"Backup job created: {self.current_job_id}")
        
        for root_path in paths:
            if not os.path.exists(root_path): continue
            for root, dirs, files in os.walk(root_path):
                for file in files:
                    if not self.is_running: return
                    while self.paused: time.sleep(1)
                    
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(root, root_path)
                    file_size = os.path.getsize(file_path)
                    
                    # 2. Upload and Meta
                    if self.api_client.upload_file(file_path, rel_path):
                         self.api_client.save_file_metadata(self.current_job_id, file, file_path, rel_path, file_size)
                         self.stats["processed_files"] += 1
                         self.stats["processed_size"] += file_size
                         logging.info(f"Successfully backed up: {file}")
                    
                    if self.stats["processed_files"] % 2 == 0:
                         self.api_client.update_progress(self.current_job_id, 100 if not self.is_running else 50, self.stats["processed_size"], self.stats["processed_files"])
        
        # Mark as finished
        self.is_running = False
        logging.info("Backup process completed.")

    def stop(self):
        self.is_running = False

    def pause(self):
        self.paused = True

    def resume(self):
        self.paused = False
