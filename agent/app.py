import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import threading
import time
import socket
import platform
import os
import json
import uuid
import sys

# If customtkinter is available, use it for IDrive premium look
try:
    import customtkinter as ctk
    ctk.set_appearance_mode("light")
    ctk.set_default_color_theme("blue")
except ImportError:
    ctk = None

from api_client import BackupAPIClient
from backup_engine import BackupEngine

import logging
import pystray
from PIL import Image, ImageDraw
import winreg # For Windows Auto-start

# Setup Logging in APPDATA to ensure write permissions
log_dir = os.path.join(os.environ.get('APPDATA'), 'IDTraumBackup')
if not os.path.exists(log_dir): os.makedirs(log_dir)
log_path = os.path.join(log_dir, 'agent.log')

logging.basicConfig(
    filename=log_path,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Main Application Class
class TraumbBackupApp(ctk.CTk if ctk else tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("ID-TRAUM VPS Cloud Backup")
        self.geometry("800x600")
        
        # 1. Config & State
        self.base_url = "https://backup.modulesfarm.com/api"
        self.api = BackupAPIClient(self.base_url)
        self.engine = BackupEngine(self.api)
        self.is_connected = False
        self.current_job = "IDLE"
        self.active_backup_paths = ["C:\\Users\\Desktop", "C:\\Users\\Documents"]
        self.last_command = None
        self.last_restore_id = None
        self.is_restoring = False
        logging.info("Application initialized")
        
        # 2. UI Layout
        self._setup_ui()
        self._add_to_startup() # Set auto-start
        
        # 3. Handle Window Close
        self.protocol("WM_DELETE_WINDOW", self._on_closing)
        
        # 4. Start Threads
        self.heartbeat_thread = threading.Thread(target=self._heartbeat_loop, daemon=True)
        self.heartbeat_thread.start()
        
        self.ui_thread = threading.Thread(target=self._ui_update_loop, daemon=True)
        self.ui_thread.start()
        
        # 5. Setup Tray Icon
        self._setup_tray()

    def _add_to_startup(self):
        try:
            # Get current executable path (handles both script and frozen exe)
            exe_path = sys.executable if getattr(sys, 'frozen', False) else f'"{os.path.realpath(__file__)}"'
            
            key = winreg.HKEY_CURRENT_USER
            key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
            with winreg.OpenKey(key, key_path, 0, winreg.KEY_SET_VALUE) as reg_key:
                winreg.SetValueEx(reg_key, "IDTraumBackup", 0, winreg.REG_SZ, f'"{exe_path}"')
            logging.info(f"Auto-start registered: {exe_path}")
        except Exception as e:
            logging.error(f"Failed to set auto-start: {e}")

    def _setup_tray(self):
        # Create a simple icon for the tray
        icon_img = Image.new('RGB', (64, 64), color=(0, 114, 188))
        d = ImageDraw.Draw(icon_img)
        d.text((10, 10), "ID", fill=(255, 255, 255))
        
        menu = pystray.Menu(
            pystray.MenuItem("Open Dashboard", self._show_window),
            pystray.MenuItem("Open Logs", self.open_logs),
            pystray.MenuItem("Exit Completely", self._exit_app)
        )
        self.icon = pystray.Icon("ID-TRAUM", icon_img, "ID-TRAUM Backup", menu)
        threading.Thread(target=self.icon.run, daemon=True).start()

    def open_logs(self):
        try:
            os.startfile(log_path)
        except Exception as e:
            logging.error(f"Failed to open log file: {e}")

    def _on_closing(self):
        self.withdraw() # Hide window but keep app running
        logging.info("Window minimized to tray")

    def _show_window(self):
        self.deiconify()
        self.lift()
        self.focus_force()

    def _exit_app(self):
        self.icon.stop()
        self.destroy()
        os._exit(0)

    def _setup_ui(self):
        # Sidebar for navigation
        self.sidebar_frame = ctk.CTkFrame(self, width=200, corner_radius=0) if ctk else tk.Frame(self, bg="#f0f0f0")
        self.sidebar_frame.pack(side="left", fill="y")
        
        title_label = ctk.CTkLabel(self.sidebar_frame, text="ID-TRAUM", font=("Arial", 20, "bold"), text_color="#0072bc") if ctk else tk.Label(self.sidebar_frame, text="ID-TRAUM")
        title_label.pack(pady=20, padx=20)
        
        self.btn_dashboard = self._create_nav_btn("Dashboard")
        self.btn_backup = self._create_nav_btn("Backup")
        
        # Main Content Area
        self.content_frame = ctk.CTkFrame(self, corner_radius=0, fg_color="transparent") if ctk else tk.Frame(self)
        self.content_frame.pack(side="right", fill="both", expand=True, padx=30, pady=30)
        
        # Dashboard Overview (Default)
        self.show_dashboard()

    def _create_nav_btn(self, text):
        if ctk:
            btn = ctk.CTkButton(self.sidebar_frame, text=text, fg_color="transparent", text_color="#333", anchor="w", corner_radius=0)
            btn.pack(fill="x", pady=2)
            return btn
        return tk.Button(self.sidebar_frame, text=text)

    def _create_stat_label(self, parent, title, value):
        f = ctk.CTkFrame(parent, corner_radius=8, fg_color="#fff", width=150) if ctk else tk.Frame(parent)
        f.pack(side="left", padx=5, fill="y")
        ctk.CTkLabel(f, text=title, font=("Arial", 11, "bold"), text_color="#666").pack(padx=20, pady=(10, 0))
        lbl = ctk.CTkLabel(f, text=value, font=("Arial", 16, "bold"), text_color="#333")
        lbl.pack(padx=20, pady=(0, 10))
        return lbl

    def show_dashboard(self):
        self._clear_content()
        
        header = ctk.CTkLabel(self.content_frame, text="Real-time Cloud Protection", font=("Arial", 24, "bold")) if ctk else tk.Label(self.content_frame, text="Overview")
        header.pack(pady=10, anchor="w")
        
        # Connection Status Card
        status_card = ctk.CTkFrame(self.content_frame, corner_radius=10, fg_color="#fff") if ctk else tk.Frame(self.content_frame)
        status_card.pack(fill="x", pady=10)
        
        server_display = self.base_url.replace("https://", "").replace("/api", "")
        self.lbl_connection = ctk.CTkLabel(status_card, text=f"●  Connected to node: {server_display}", text_color="#28a745") if ctk else tk.Label(status_card, text="Connected...")
        self.lbl_connection.pack(pady=15, padx=20, side="left")
        
        btn_start = ctk.CTkButton(status_card, text="Start Sync", command=self.run_manual_backup, fg_color="#0072bc") if ctk else tk.Button(status_card)
        btn_start.pack(pady=15, padx=20, side="right")

        # Stats Row
        self.stats_frame = ctk.CTkFrame(self.content_frame, fg_color="transparent") if ctk else tk.Frame(self.content_frame)
        self.stats_frame.pack(fill="x", pady=10)
        
        self.lbl_files = self._create_stat_label(self.stats_frame, "Total Protected", "0 Files")
        self.lbl_size = self._create_stat_label(self.stats_frame, "Data Size", "0.0 MB")

        # Progress Section
        self.progress_label = ctk.CTkLabel(self.content_frame, text="Waiting for next cycle...", font=("Arial", 14)) if ctk else tk.Label(self.content_frame)
        self.progress_label.pack(pady=10, anchor="w")
        
        self.progress_bar = ctk.CTkProgressBar(self.content_frame, width=500) if ctk else ttk.Progressbar(self.content_frame)
        self.progress_bar.pack(pady=5, fill="x")
        self.progress_bar.set(0)

        # Recent Activity Logs (New Section)
        log_header = ctk.CTkLabel(self.content_frame, text="Recent Activity (Cloud Logs)", font=("Arial", 16, "bold")) if ctk else tk.Label(self.content_frame)
        log_header.pack(pady=(20, 10), anchor="w")
        
        self.log_textbox = ctk.CTkTextbox(self.content_frame, height=200, corner_radius=10, fg_color="#f8f9fa", text_color="#333") if ctk else tk.Text(self.content_frame)
        self.log_textbox.pack(fill="both", expand=True)
        self.log_textbox.insert("0.0", "Welcome to ID-TRAUM Cloud Backup Agent\nReady for operation...\n")
        self.log_textbox.configure(state="disabled")

        btn_logs = ctk.CTkButton(self.content_frame, text="Open Full Log File", command=self.open_logs, fg_color="#6c757d") if ctk else tk.Button(self.content_frame, text="Open Logs", command=self.open_logs)
        btn_logs.pack(pady=10)

    def _ui_update_loop(self):
        while True:
            try:
                stats = self.engine.stats
                processed = stats.get('processed_files', 0)
                size_mb = stats.get('processed_size', 0) / (1024*1024)
                
                if hasattr(self, 'lbl_files'):
                    self.lbl_files.configure(text=f"{processed} Files")
                    self.lbl_size.configure(text=f"{size_mb:.2f} MB")
                
                if self.engine.observer and self.engine.observer.is_alive():
                    if hasattr(self, 'progress_label'):
                        self.progress_label.configure(text=f"Protection Active: Monitoring {len(self.active_backup_paths)} path(s)")
                        self.progress_bar.set(0.5) # Indeterminate "active" state
                elif self.current_job == "IDLE":
                    if hasattr(self, 'progress_label'):
                        self.progress_label.configure(text="Ready & Idle")
                        self.progress_bar.set(0)
            except: pass
            time.sleep(1)

    def _add_log(self, message):
        timestamp = time.strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}\n"
        if hasattr(self, 'log_textbox'):
            self.log_textbox.configure(state="normal")
            self.log_textbox.insert("end", log_entry)
            self.log_textbox.see("end")
            self.log_textbox.configure(state="disabled")
        logging.info(message)

    def _clear_content(self):
        for widget in self.content_frame.winfo_children():
            widget.destroy()

    def _heartbeat_loop(self):
        while True:
            # First register
            if not self.is_connected:
                success = self.api.register()
                if success:
                    self.is_connected = True
                    self.lbl_connection.configure(text="●  Online & Protected", text_color="#28a745")
                    self._add_log("System successfully registered with VPS Console")
                else:
                    self.lbl_connection.configure(text="●  Offline: Auth Failed", text_color="#dc3545")
                    self._add_log("ERROR: Connection failed to VPS Master Node")
            
            # Send heartbeat
            if self.is_connected:
                # Detect drives and common folders to report to Admin
                nodes = []
                if os.name == 'nt':
                    import string
                    # Drives
                    nodes = [f"{d}:\\" for d in string.ascii_uppercase if os.path.exists(f"{d}:\\")]
                    # Common Folders
                    user_profile = os.environ.get('USERPROFILE')
                    if user_profile:
                        for folder in ['Desktop', 'Documents', 'Downloads']:
                            p = os.path.join(user_profile, folder)
                            if os.path.exists(p): nodes.append(p)
                else:
                    nodes = ["/"]
                
                drive_list = ",".join(nodes)

                data = self.api.heartbeat(self.current_job, drive_list=drive_list)
                if data:
                    self._process_remote_command(data.get('command'), data.get('config'))
                
                # Check if real-time sync needs to be started (e.g. on restart)
                if self.active_backup_paths and (not self.engine.observer or not self.engine.observer.is_alive()):
                     self.engine.start_realtime_sync(self.active_backup_paths)
            
            time.sleep(10)

    def _process_remote_command(self, command, config):
        if not command or command == "IDLE":
            return

        if command != self.last_command:
            logging.info(f"Processing new remote command: {command}")
            self._add_log(f"Remote command received: {command}")
            self.last_command = command

        if config and config.get('backup_paths'):
            raw_paths = config['backup_paths']
            new_paths = []
            
            # Robustly handle both list of paths and potentially mangled single strings
            if isinstance(raw_paths, list):
                for p in raw_paths:
                    if '\n' in p or ',' in p:
                        import re
                        new_paths.extend([x.strip() for x in re.split(r'[\n,]', p) if x.strip()])
                    else:
                        new_paths.append(p.strip())
            elif isinstance(raw_paths, str):
                import re
                new_paths = [x.strip() for x in re.split(r'[\n,]', raw_paths) if x.strip()]
            
            # Filter and unique
            new_paths = list(dict.fromkeys([p for p in new_paths if p]))

            if new_paths != self.active_backup_paths:
                self.active_backup_paths = new_paths
                logging.info(f"Paths updated from cloud: {self.active_backup_paths}")
                self._add_log("Backup paths updated from cloud console")
                # Start real-time sync automatically
                self.engine.start_realtime_sync(self.active_backup_paths)

        if command == "START":
            self.run_manual_backup()
        elif command == "PAUSE":
            self.engine.pause()
            self.current_job = "PAUSED"
        elif command == "RESUME":
            self.engine.resume()
            self.current_job = "BUSY"
        elif command == "CANCEL":
            self.engine.stop()
            self.current_job = "CANCELLED"
        elif command == "RESTORE" and config.get('restore_config'):
            restore_id = config['restore_config'].get('file_id')
            if restore_id != self.last_restore_id:
                if not self.is_restoring:
                    self.last_restore_id = restore_id
                    logging.info(f"Triggering restoration for file ID: {restore_id}")
                    threading.Thread(target=self.run_restore, args=(config['restore_config'],), daemon=True).start()
                else:
                    logging.info("Restore command received but restoration already in progress")
            else:
                # Same restore ID, skip to avoid loops
                pass

    def run_manual_backup(self):
        if self.current_job == "BUSY":
             # Silent ignore as requested
             return
             
        self.current_job = "BUSY"
        threading.Thread(target=self._backup_task, daemon=True).start()

    def _backup_task(self):
        try:
            self._add_log(f"Manual backup started at {self.base_url}")
            self.progress_label.configure(text="Connecting to Storage node...")
            self.engine.start_backup(self.active_backup_paths)
            
            # Final stats check after task completion
            stats = self.engine.stats
            processed = stats.get('processed_files', 0)
            size_mb = stats.get('processed_size', 0) / (1024*1024)
            
            self._add_log(f"Backup session completed. Total: {processed} files ({size_mb:.1f} MB)")
            self.progress_label.configure(text=f"Backup Completed! ({processed} files)")
            self.progress_bar.set(1)
            self.current_job = "IDLE"
        except Exception as e:
            self._add_log(f"CRITICAL ERROR: {str(e)}")
            self.current_job = "IDLE"

    def run_restore(self, config):
        if self.is_restoring: return
        self.is_restoring = True
        
        file_id = config.get('file_id')
        target = config.get('target_dir', 'C:\\Restored')
        
        logging.info(f"Starting restoration task: File={file_id}, Target={target}")
        self._add_log(f"Restoration started for File ID: {file_id}")

        try:
            if not os.path.exists(target): 
                try:
                    os.makedirs(target)
                    logging.info(f"Created target directory: {target}")
                except Exception as e:
                    logging.error(f"Failed to create target directory {target}: {e}")
                    self._add_log(f"Restore Error: Could not create directory {target}")
                    return

            # Generate filename base on original name if possible
            save_name = f"RESTORED_{int(time.time())}_{str(uuid.uuid4())[:4]}"
            save_path = os.path.join(target, save_name)
            
            self.progress_label.configure(text=f"Downloading restoration file: {file_id}...")
            
            success = self.api.download_file(file_id, save_path)
            
            if success:
                 logging.info(f"Restoration successful. File saved to: {save_path}")
                 self._add_log(f"Restore Success: File saved to {save_path}")
                 messagebox.showinfo("Success", f"Remote restoration completed to {save_path}")
                 self.progress_label.configure(text="Restoration successful")
            else:
                 logging.error(f"Restoration failed for file ID: {file_id}")
                 self._add_log(f"Restore Failed: API error during download")
                 messagebox.showerror("Error", "Restoration failed")
        except Exception as e:
            logging.error(f"CRITICAL Restore Error: {e}")
            self._add_log(f"Restore Critical Error: {str(e)}")
        finally:
            self.is_restoring = False
            self.progress_label.configure(text="Waiting for next cycle...")

if __name__ == "__main__":
    app = TraumbBackupApp()
    app.mainloop()
