# Get selected files from the active Windows File Explorer window or Desktop
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class User32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
}
"@ -ErrorAction SilentlyContinue

try {
    $fgHwnd = [User32]::GetForegroundWindow()
    $shell = New-Object -ComObject Shell.Application
    $items = [System.Collections.Generic.List[string]]::new()

    foreach ($window in $shell.Windows()) {
        try {
            if ($window.HWND -eq $fgHwnd) {
                $selection = $window.Document.SelectedItems()
                foreach ($item in $selection) {
                    $items.Add($item.Path)
                }
                break
            }
        } catch {}
    }

    # If nothing found matching foreground HWND, check if any Explorer window has selection
    if ($items.Count -eq 0) {
        foreach ($window in $shell.Windows()) {
            try {
                $selection = $window.Document.SelectedItems()
                if ($selection.Count -gt 0) {
                    foreach ($item in $selection) {
                        $items.Add($item.Path)
                    }
                    break
                }
            } catch {}
        }
    }

    if ($items.Count -eq 0) {
        # Check clipboard file drop list as fallback
        try {
            $clipFiles = Get-Clipboard -Format FileDropList -ErrorAction SilentlyContinue
            if ($clipFiles) {
                foreach ($f in $clipFiles) {
                    $items.Add($f)
                }
            }
        } catch {}
    }

    if ($items.Count -eq 0) {
        Write-Output "[]"
    } else {
        Write-Output ($items | ConvertTo-Json -Compress)
    }
} catch {
    Write-Output "[]"
}
