import os
import time

class BackupEngine:
    def __init__(self, api_client):
        self.api_client = api_client
        self.is_running = False
        self.paused = False
        self.current_job_id = None
        self.stats = {
            "total_files": 0,
            "processed_files": 0,
            "total_size": 0,
            "processed_size": 0
        }

    def start_backup(self, paths):
        self.is_running = True
        self.paused = False
        self.stats = {k: 0 for k in self.stats}
        
        # 1. Start job in API
        job_res = self.api_client.start_backup("manual")
        if job_res:
            self.current_job_id = job_res.get('id')
        
        # 2. Iterate and upload
        for root_path in paths:
            if not self.is_running: break
            for root, dirs, files in os.walk(root_path):
                if not self.is_running: break
                while self.paused:
                    time.sleep(1)
                
                for file in files:
                    if not self.is_running: break
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(root, root_path)
                    
                    # 3. Upload file
                    success = self.api_client.upload_file(file_path, rel_path)
                    if success:
                        file_size = os.path.getsize(file_path)
                        self.stats["processed_files"] += 1
                        self.stats["processed_size"] += file_size
                        
                        # 4. Update progress periodically
                        if self.stats["processed_files"] % 5 == 0:
                            percent = int((self.stats["processed_files"] / (self.stats["total_files"] or 1)) * 100)
                            self.api_client.update_progress(
                                self.current_job_id, percent, self.stats["processed_size"], self.stats["processed_files"]
                            )

    def stop(self):
        self.is_running = False

    def pause(self):
        self.paused = True

    def resume(self):
        self.paused = False
