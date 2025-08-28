import tkinter as tk
import subprocess
import threading
import time
import os
import sys
from tkinter import messagebox
import pystray
from PIL import Image, ImageDraw
import webbrowser
import psutil

class DirectTodoAppLauncher:
    def __init__(self):
        self.root = None
        self.icon = None
        self.server_running = False
        self.project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.port = 8087
        self.cmd_process = None
        
    def create_icon_image(self):
        """Create a simple icon for the system tray"""
        image = Image.new('RGBA', (64, 64), color=(0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        # Draw a modern todo list icon
        draw.ellipse([8, 8, 56, 56], fill=(45, 123, 255, 255), outline=(33, 91, 189, 255), width=2)
        draw.line([20, 32, 28, 40], fill='white', width=3)
        draw.line([28, 40, 44, 24], fill='white', width=3)
        draw.ellipse([18, 18, 22, 22], fill='white')
        draw.ellipse([40, 42, 44, 46], fill='white')
        
        return image
    
    def check_port_in_use(self):
        """Check if port is in use"""
        try:
            for conn in psutil.net_connections(kind='inet'):
                if conn.laddr.port == self.port and conn.status == psutil.CONN_LISTEN:
                    return conn.pid
            return None
        except:
            return None
    
    def kill_process_on_port(self, pid):
        """Kill process"""
        try:
            p = psutil.Process(pid)
            p.terminate()
            try:
                p.wait(timeout=5)
            except psutil.TimeoutExpired:
                p.kill()
            time.sleep(2)
        except:
            pass
    
    def start_server(self):
        """Start server with hidden terminal"""
        try:
            # Check for existing processes
            existing_pid = self.check_port_in_use()
            if existing_pid:
                print(f"Killing existing process on port {self.port}: {existing_pid}")
                self.kill_process_on_port(existing_pid)
                time.sleep(3)
            
            # Create the command to run
            cmd = f'cd /d "{self.project_root}" && npm run start'
            
            # Start the process with hidden window
            self.cmd_process = subprocess.Popen(
                f'cmd /c "{cmd}"',
                shell=True,
                cwd=self.project_root,
                # Hide the console window
                creationflags=subprocess.CREATE_NO_WINDOW,
                # Don't redirect stdout/stderr to let Node.js run naturally
                stdout=None,
                stderr=None
            )
            
            self.server_running = True
            print("Server started in background (hidden terminal)")
            
            # Wait for server to start
            time.sleep(8)
            
            # Verify server is running by checking the port
            if self.check_port_in_use():
                print("Server verified running on port", self.port)
                # Open browser
                webbrowser.open(f'http://localhost:{self.port}')
                return True
            else:
                print("Server failed to start - port not in use")
                self.server_running = False
                return False
            
        except Exception as e:
            print(f"Error starting server: {e}")
            return False
    
    def stop_server(self):
        """Stop the server"""
        try:
            self.server_running = False
            
            # Kill any process on our port
            existing_pid = self.check_port_in_use()
            if existing_pid:
                print(f"Stopping process on port {self.port}: {existing_pid}")
                self.kill_process_on_port(existing_pid)
            
            # Close the command prompt if we have a reference
            if self.cmd_process:
                try:
                    self.cmd_process.terminate()
                except:
                    pass
                self.cmd_process = None
            
            print("Server stopped")
            
        except Exception as e:
            print(f"Error stopping server: {e}")
    
    def quit_application(self, icon_param=None, item=None):
        """Quit application"""
        try:
            self.stop_server()
            
            if self.icon:
                self.icon.stop()
            
            if self.root:
                self.root.quit()
                self.root.destroy()
            
            sys.exit(0)
            
        except Exception as e:
            print(f"Error during quit: {e}")
            sys.exit(1)
    
    def open_browser(self, icon_param=None, item=None):
        """Open browser"""
        webbrowser.open(f'http://localhost:{self.port}')
    
    def show_window(self, icon_param=None, item=None):
        """Show the main window"""
        if self.root:
            self.root.deiconify()  # Restore window
            self.root.lift()       # Bring to front
            self.root.focus_force() # Give focus
    
    def hide_window(self):
        """Hide the main window to system tray"""
        if self.root:
            self.root.withdraw()  # Hide window
    
    def show_status(self, icon_param=None, item=None):
        """Show status"""
        status = "Running" if self.server_running else "Stopped"
        try:
            messagebox.showinfo("Todo App Status", f"Server Status: {status}\nPort: {self.port}")
        except:
            print(f"Status: {status} on port {self.port}")
    
    def create_system_tray(self):
        """Create system tray"""
        try:
            menu = pystray.Menu(
                pystray.MenuItem("Show Window", self.show_window),
                pystray.MenuItem("Open App", self.open_browser),
                pystray.MenuItem("Status", self.show_status),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem("Quit", self.quit_application)
            )
            
            image = self.create_icon_image()
            self.icon = pystray.Icon("TodoApp", image, "Todo App", menu)
            
            def run_icon():
                self.icon.run()
            
            icon_thread = threading.Thread(target=run_icon, daemon=True)
            icon_thread.start()
            
        except Exception as e:
            print(f"Error creating system tray: {e}")
    
    def create_main_window(self):
        """Create main window"""
        self.root = tk.Tk()
        self.root.title("Todo App Launcher - System Tray Mode")
        self.root.geometry("500x400")
        self.root.resizable(False, False)
        
        # Center window
        self.root.eval('tk::PlaceWindow . center')
        
        # Main frame
        main_frame = tk.Frame(self.root, padx=20, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = tk.Label(main_frame, text="Personal Todo App", 
                              font=("Arial", 16, "bold"))
        title_label.pack(pady=10)
        
        subtitle_label = tk.Label(main_frame, text="System Tray Integration", 
                                 font=("Arial", 10, "italic"), fg="gray")
        subtitle_label.pack(pady=5)
        
        # Status
        self.status_label = tk.Label(main_frame, text="Ready to start", 
                                   font=("Arial", 10))
        self.status_label.pack(pady=10)
        
        # Buttons
        buttons_frame = tk.Frame(main_frame)
        buttons_frame.pack(pady=20)
        
        start_btn = tk.Button(buttons_frame, text="Start Server", 
                             command=self.start_server_thread,
                             bg="#4CAF50", fg="white", font=("Arial", 12),
                             padx=20, pady=10)
        start_btn.pack(side=tk.LEFT, padx=10)
        
        stop_btn = tk.Button(buttons_frame, text="Stop Server", 
                            command=self.stop_server_thread,
                            bg="#f44336", fg="white", font=("Arial", 12),
                            padx=20, pady=10)
        stop_btn.pack(side=tk.LEFT, padx=10)
        
        browser_btn = tk.Button(buttons_frame, text="Open App", 
                               command=self.open_browser,
                               bg="#2196F3", fg="white", font=("Arial", 12),
                               padx=20, pady=10)
        browser_btn.pack(side=tk.LEFT, padx=10)
        
        # Info
        info_frame = tk.Frame(main_frame)
        info_frame.pack(pady=20, fill=tk.X)
        
        info_label = tk.Label(info_frame, 
                             text=f"App URL: http://localhost:{self.port}",
                             font=("Arial", 10), fg="blue")
        info_label.pack(pady=5)
        
        # Instructions
        instructions = tk.Text(info_frame, height=8, width=60, font=("Arial", 9), 
                              wrap=tk.WORD, state=tk.DISABLED, bg="#f9f9f9")
        instructions.pack(pady=10)
        
        instructions.config(state=tk.NORMAL)
        instructions.insert(tk.END, """System Tray Mode Instructions:

1. Click 'Start Server' to launch the app in background
2. After starting, this window will automatically minimize to system tray
3. The app will automatically open in your browser
4. Clicking the minimize button (─) also hides to system tray (not taskbar)
5. Closing window (×) also minimizes to tray (doesn't quit the app)
6. Right-click the system tray icon to access controls:
   - 'Show Window' - Restore this launcher window
   - 'Open App' - Open the app in browser
   - 'Status' - Check server status
   - 'Quit' - Properly shut down the server

The server runs completely hidden with full system tray integration.""")
        instructions.config(state=tk.DISABLED)
        
        # Handle window close
        self.root.protocol("WM_DELETE_WINDOW", self.on_window_close)
        
        # Start monitoring for minimize button clicks
        self.root.after(100, self.check_window_state)
        
        return self.root
    
    def start_server_thread(self):
        """Start server in thread and minimize to tray"""
        def start():
            self.status_label.config(text="Starting server...")
            self.root.update()
            
            success = self.start_server()
            if success:
                self.status_label.config(text="Server running in background")
                # Minimize to system tray after successful start
                time.sleep(1)  # Brief delay to let user see the success message
                self.hide_window()
            else:
                self.status_label.config(text="Failed to start server")
        
        thread = threading.Thread(target=start, daemon=True)
        thread.start()
    
    def stop_server_thread(self):
        """Stop server in thread"""
        def stop():
            self.status_label.config(text="Stopping server...")
            self.root.update()
            self.stop_server()
            self.status_label.config(text="Server stopped")
        
        thread = threading.Thread(target=stop, daemon=True)
        thread.start()
    
    def check_window_state(self):
        """Check if window is minimized and redirect to tray"""
        if self.root:
            try:
                state = self.root.state()
                if state == 'iconic':  # Window is minimized
                    self.hide_window()
                # Schedule next check
                self.root.after(100, self.check_window_state)
            except:
                pass
    
    def on_window_close(self):
        """Handle window close event - minimize to tray instead of closing"""
        self.hide_window()
    
    def run(self):
        """Run the application"""
        try:
            self.create_system_tray()
            self.create_main_window()
            self.root.mainloop()
            
        except KeyboardInterrupt:
            self.quit_application()
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    app = DirectTodoAppLauncher()
    app.run()
