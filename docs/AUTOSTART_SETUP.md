# Auto-Start Setup Instructions

To have the Cyber Kiosk launch automatically when your Raspberry Pi boots, follow these steps:

## Option 1: LXDE Autostart (Recommended)

1. Create or edit the LXDE autostart file:
```bash
mkdir -p ~/.config/lxsession/LXDE-pi
nano ~/.config/lxsession/LXDE-pi/autostart
```

2. Add the following lines:
```
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash
@/home/YOUR_USERNAME/cyber-kiosk/launch-kiosk.sh
```

3. Save and exit (Ctrl+X, Y, Enter)

4. Reboot to test:
```bash
sudo reboot
```

## Option 2: Manual Launch

If you don't want auto-start, launch manually from terminal:
```bash
~/cyber-kiosk/launch-kiosk.sh
```

Or double-click `launch-kiosk.sh` from the file manager.

## Disable Auto-Start

To stop the kiosk from launching on boot:

1. Edit the autostart file:
```bash
nano ~/.config/lxsession/LXDE-pi/autostart
```

2. Remove or comment out the kiosk line:
```
#@/home/YOUR_USERNAME/cyber-kiosk/launch-kiosk.sh
```

3. Save and reboot.

## Required Packages

Make sure these are installed:
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser unclutter x11-xserver-utils
```

## Exiting Kiosk Mode

To exit the fullscreen kiosk:
- Press `Alt + F4` to close Chromium
- Or SSH in and run: `pkill chromium`

## Troubleshooting

### Screen goes blank
The script disables power management, but if it still blanks:
```bash
sudo nano /etc/lightdm/lightdm.conf
```
Add under `[Seat:*]`:
```
xserver-command=X -s 0 -dpms
```

### Cursor visible
Make sure unclutter is installed:
```bash
sudo apt-get install unclutter
```

### Kiosk doesn't start
Check the launcher script is executable:
```bash
chmod +x ~/cyber-kiosk/launch-kiosk.sh
```

View system logs:
```bash
tail -f ~/.xsession-errors
```
