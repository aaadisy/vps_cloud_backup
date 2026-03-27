import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import threading
import time
import socket
import platform
import os
import json
import uuid

# If customtkinter is available, use it for IDrive premium look
try:
    import customtkinter as ctk
    ctk.set_appearance_mode("light")
    ctk.set_default_color_theme("blue")
except ImportError:
    ctk = None

from api_client import BackupAPIClient
from backup_engine import BackupEngine

# Main Application Class
class TraumbBackupApp(ctk.CTk if ctk else tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("ID-TRAUM VPS Cloud Backup - Agent")
        self.geometry("800x600")
        
        # 1. Config & State
        self.base_url = "https://backup.modulesfarm.com/api"
        self.api = BackupAPIClient(self.base_url)
        self.engine = BackupEngine(self.api)
        self.is_connected = False
        self.current_job = "IDLE"
        self.active_backup_paths = ["C:\\Users\\Desktop", "D:\\Data"] # Dummy default
        
        # 2. UI Layout
        self._setup_ui()
        
        # 3. Start Heartbeat Thread
        self.heartbeat_thread = threading.Thread(target=self._heartbeat_loop, daemon=True)
        self.heartbeat_thread.start()

    def _setup_ui(self):
        # Sidebar for navigation (Like IDrive)
        self.sidebar_frame = ctk.CTkFrame(self, width=200, corner_radius=0) if ctk else tk.Frame(self, bg="#f0f0f0", width=200)
        self.sidebar_frame.pack(side="left", fill="y")
        
        title_label = ctk.CTkLabel(self.sidebar_frame, text="ID-TRAUM", font=("Arial", 20, "bold"), text_color="#0072bc") if ctk else tk.Label(self.sidebar_frame, text="ID-TRAUM")
        title_label.pack(pady=20, padx=20)
        
        self.btn_dashboard = self._create_nav_btn("Dashboard")
        self.btn_backup = self._create_nav_btn("Backup")
        self.btn_restore = self._create_nav_btn("Restore")
        self.btn_settings = self._create_nav_btn("Settings")
        
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

    def show_dashboard(self):
        self._clear_content()
        
        header = ctk.CTkLabel(self.content_frame, text="Backup Status Overview", font=("Arial", 24, "bold")) if ctk else tk.Label(self.content_frame, text="Overview")
        header.pack(pady=10, anchor="w")
        
        # Connection Status Card
        status_card = ctk.CTkFrame(self.content_frame, corner_radius=10, fg_color="#fff") if ctk else tk.Frame(self.content_frame)
        status_card.pack(fill="x", pady=20)
        
        self.lbl_connection = ctk.CTkLabel(status_card, text="●  Connecting to VPS Console...", text_color="#ffc107") if ctk else tk.Label(status_card, text="Connecting...")
        self.lbl_connection.pack(pady=15, padx=20, side="left")
        
        btn_start = ctk.CTkButton(status_card, text="Run Backup Now", command=self.run_manual_backup, fg_color="#0072bc") if ctk else tk.Button(status_card)
        btn_start.pack(pady=15, padx=20, side="right")

        # Progress Section
        self.progress_label = ctk.CTkLabel(self.content_frame, text="Ready for backup", font=("Arial", 14)) if ctk else tk.Label(self.content_frame)
        self.progress_label.pack(pady=10, anchor="w")
        
        self.progress_bar = ctk.CTkProgressBar(self.content_frame, width=500) if ctk else ttk.Progressbar(self.content_frame)
        self.progress_bar.pack(pady=10, fill="x")
        self.progress_bar.set(0)

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
                else:
                    self.lbl_connection.configure(text="●  Offline: Auth Failed", text_color="#dc3545")
            
            # Send heartbeat
            if self.is_connected:
                data = self.api.heartbeat(self.current_job)
                if data:
                    self._process_remote_command(data.get('command'), data.get('config'))
            
            time.sleep(10)

    def _process_remote_command(self, command, config):
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
            threading.Thread(target=self.run_restore, args=(config['restore_config'],)).start()

    def run_manual_backup(self):
        if self.current_job == "BUSY":
             messagebox.showinfo("Wait", "Backup is already running")
             return
             
        self.current_job = "BUSY"
        threading.Thread(target=self._backup_task, daemon=True).start()

    def _backup_task(self):
        try:
            self.progress_label.configure(text="Scanning files for backup...")
            # Simulate scanning...
            time.sleep(2)
            
            # Start actual engine
            self.engine.start_backup(self.active_backup_paths)
            
            # Update UI periodically (Should use queue or after for safety)
            # For brevity:
            self.progress_label.configure(text="Backup Completed successfully!")
            self.progress_bar.set(1)
            self.current_job = "IDLE"
        except Exception as e:
            self.progress_label.configure(text=f"Error: {str(e)}")
            self.current_job = "IDLE"

    def run_restore(self, config):
        file_id = config.get('file_id')
        target = config.get('target_dir', 'C:\\Restored')
        
        if not os.path.exists(target): os.makedirs(target)
        save_path = os.path.join(target, f"RESTORE_{str(uuid.uuid4())[:8]}")
        
        self.progress_label.configure(text=f"Downloading restoration file: {file_id}...")
        success = self.api.download_file(file_id, save_path)
        
        if success:
             messagebox.showinfo("Success", f"Remote restoration completed to {save_path}")
             self.progress_label.configure(text="Restoration successful")
        else:
             messagebox.showerror("Error", "Restoration failed")

if __name__ == "__main__":
    app = TraumbBackupApp()
    app.mainloop()
