import requests
import json
import uuid
import socket
import platform
import logging

class BackupAPIClient:
    def __init__(self, base_url, device_uuid=None):
        self.base_url = base_url
        self.device_uuid = device_uuid or self._get_hw_id()
        self.token = None
        self.headers = {}
        logging.info(f"API Client initialized for device: {self.device_uuid}")

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
            logging.info(f"Registering device at {self.base_url}/device/register")
            res = requests.post(f"{self.base_url}/device/register", json=payload)
            if res.status_code in [200, 201]:
                self.token = res.json().get('token')
                self.headers = {"Authorization": f"Bearer {self.token}"}
                logging.info("Registration successful")
                return True
            return False
        except Exception as e:
            logging.error(f"Registration Error: {e}")
            return False

    def start_backup(self, backup_type="manual"):
        try:
            payload = {
                "device_uuid": self.device_uuid,
                "backup_type": backup_type
            }
            url = f"{self.base_url}/backup/start"
            logging.info(f"POST {url} Payload: {payload}")
            res = requests.post(url, json=payload, headers=self.headers)
            logging.info(f"Start Backup Response [{res.status_code}]: {res.text[:200]}")
            if res.status_code in [200, 201]:
                return res.json()
            logging.error(f"Backup start failed: {res.status_code}")
            return None
        except Exception as e:
            logging.error(f"Start Backup Error: {e}")
            return None

    def heartbeat(self, status="IDLE", drive_list=None):
        try:
            payload = {
                "device_uuid": self.device_uuid,
                "current_status": status,
                "drive_list": drive_list
            }
            url = f"{self.base_url}/device/heartbeat"
            res = requests.post(url, json=payload, headers=self.headers)
            
            # Log heartbeat only if command is present to avoid noise
            if res.status_code == 200:
                data = res.json()
                if data.get('command') and data.get('command') != "IDLE":
                     logging.info(f"RECV {url} Response: {data}")
                return data
            else:
                logging.error(f"Heartbeat failed [{res.status_code}]: {res.text[:100]}")
            return None
        except Exception as e:
            logging.error(f"Heartbeat Error: {e}")
            return None

    def save_file_metadata(self, job_id, file_name, original_path, vps_path, size):
        try:
            payload = {
                "device_uuid": self.device_uuid,
                "backup_job_id": job_id,
                "file_name": file_name,
                "original_path": original_path,
                "vps_path": vps_path,
                "file_size": size
            }
            url = f"{self.base_url}/backup/file-metadata"
            logging.info(f"POST {url} Payload: {payload}")
            res = requests.post(url, json=payload, headers=self.headers)
            logging.info(f"Metadata Response [{res.status_code}]: {res.text[:200]}")
            return res.status_code in [200, 201]
        except Exception as e:
            logging.error(f"Metadata Save Error: {e}")
            return False

    def upload_file(self, file_path, sub_path):
        try:
            with open(file_path, 'rb') as f:
                files = {'file': f}
                data = {
                    'device_uuid': self.device_uuid,
                    'sub_path': sub_path
                }
                url = f"{self.base_url}/backup/upload"
                res = requests.post(url, files=files, data=data, headers=self.headers)
                logging.info(f"Upload Response [{res.status_code}]: {res.text[:100]}")
                
                if res.status_code == 200:
                    return res.json().get('path') # Return the physical path on VPS
                return None
        except Exception as e:
            logging.error(f"Upload Error: {file_path} - {e}")
            return None

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
            url = f"{self.base_url}/raw-restore/{file_id}"
            logging.info(f"GET {url}")
            logging.info(f"Headers: {self.headers}")
            
            with requests.get(url, headers=self.headers, stream=True) as r:
                logging.info(f"Download Response Code: {r.status_code}")
                if r.status_code != 200:
                    logging.error(f"Download unsuccessful: {r.text[:200]}")
                r.raise_for_status()
                with open(save_path, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
            logging.info(f"Download complete: {save_path}")
            return True
        except Exception as e:
            logging.error(f"Download Error: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logging.error(f"Error Response Body: {e.response.text[:200]}")
            return False

