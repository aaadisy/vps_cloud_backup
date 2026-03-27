import requests
import json
import uuid
import socket
import platform

class BackupAPIClient:
    def __init__(self, base_url, device_uuid=None):
        self.base_url = base_url
        self.device_uuid = device_uuid or self._get_hw_id()
        self.token = None
        self.headers = {}

    def _get_hw_id(self):
        # Unique hardware device ID
        return str(uuid.getnode())

    def register(self):
        try:
            payload = {
                "device_name": socket.gethostname(),
                "device_uuid": self.device_uuid,
                "os_type": f"{platform.system()} {platform.release()}"
            }
            # Note: We need a secret for the first registration
            res = requests.post(f"{self.base_url}/device/register", json=payload)
            if res.status_code in [200, 201]:
                self.token = res.json().get('token')
                self.headers = {"Authorization": f"Bearer {self.token}"}
                return True
            return False
        except Exception as e:
            print(f"Registration Error: {e}")
            return False

    def start_backup(self, backup_type="manual"):
        try:
            payload = {
                "device_uuid": self.device_uuid,
                "backup_type": backup_type
            }
            res = requests.post(f"{self.base_url}/backup/start", json=payload, headers=self.headers)
            if res.status_code in [200, 201]:
                return res.json()
            return None
        except Exception as e:
            print(f"Start Backup Error: {e}")
            return None

    def heartbeat(self, status="IDLE"):
        try:
            payload = {
                "device_uuid": self.device_uuid,
                "current_status": status
            }
            res = requests.post(f"{self.base_url}/device/heartbeat", json=payload, headers=self.headers)
            if res.status_code == 200:
                return res.json()
            return None
        except Exception as e:
            print(f"Heartbeat Error: {e}")
            return None

    def save_file_metadata(self, job_id, file_name, original_path, vps_path, size):
        try:
            payload = {
                "backup_job_id": job_id,
                "file_name": file_name,
                "original_path": original_path,
                "vps_path": vps_path,
                "file_size": size
            }
            res = requests.post(f"{self.base_url}/backup/file-metadata", json=payload, headers=self.headers)
            return res.status_code in [200, 201]
        except Exception as e:
            return False

    def upload_file(self, file_path, sub_path):
        try:
            with open(file_path, 'rb') as f:
                files = {'file': f}
                data = {
                    'device_uuid': self.device_uuid,
                    'sub_path': sub_path
                }
                res = requests.post(f"{self.base_url}/backup/upload", files=files, data=data, headers=self.headers)
                return res.status_code == 200
        except Exception as e:
            print(f"Upload Error: {e}")
            return False

    def update_progress(self, job_id, percent, size, files):
        try:
            payload = {
                "progress_percent": percent,
                "total_size": size,
                "files_processed": files
            }
            res = requests.put(f"{self.base_url}/backup/progress/{job_id}", json=payload, headers=self.headers)
            return res.status_code == 200
        except Exception as e:
            return False

    def download_file(self, file_id, save_path):
        try:
            with requests.get(f"{self.base_url}/backup/download/{file_id}", headers=self.headers, stream=True) as r:
                r.raise_for_status()
                with open(save_path, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
            return True
        except Exception as e:
            print(f"Download Error: {e}")
            return False
