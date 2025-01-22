import type { TrayIconEvent } from '@tauri-apps/api/tray'
import { TrayIcon } from '@tauri-apps/api/tray'
import { getAllWindows } from '@tauri-apps/api/window'
import { handleIconState } from '@tauri-apps/plugin-positioner'
import { buildMenu } from './menu'
import { resetMainWindow } from './window'

export async function getMainTray() {
    return await TrayIcon.getById('main-tray')
}

export async function getLoadingTray() {
    return await TrayIcon.getById('loading-tray')
}

export async function triggerTrayRebuild() {
    return getAllWindows().then((windows) => {
        windows.find((w) => w.label === 'main')?.emit('rebuild-tray')
    })
}

// Function to update the tray menu
export async function rebuildTrayMenu() {
    const tray = await getMainTray()
    if (!tray) {
        return
    }
    const newMenu = await buildMenu()
    await tray.setMenu(newMenu)
}

async function onTrayAction(event: TrayIconEvent) {
    await handleIconState(event)

    if (event.type === 'Click') {
        console.log('Tray clicked:', event)

        await resetMainWindow()
    }
}

// Initialize the tray
export async function initTray(): Promise<void> {
    try {
        console.log('initTray')
        const menu = await buildMenu()
        console.log('built menu')

        await TrayIcon.getById('loading-tray').then((t) => t?.setVisible(false))
        console.log('set loading tray to false')

        await TrayIcon.new({
            id: 'main-tray',
            icon: 'icons/icon.png',
            tooltip: 'S-Tray App',
            menu,
            menuOnLeftClick: true,
            action: onTrayAction,
        })
    } catch (error) {
        console.error('Failed to create tray:', error)
    }
}

export async function initLoadingTray() {
    const loadingTray = await TrayIcon.new({
        id: 'loading-tray',
        icon: 'icons/favicon/frame_00_delay-0.1s.png',
    })

    let currentIcon = 1

    setInterval(async () => {
        if (currentIcon > 17) {
            currentIcon = 1
        }
        await loadingTray?.setIcon(
            `icons/favicon/frame_${currentIcon < 10 ? '0' : ''}${currentIcon}_delay-0.1s.png`
        )
        currentIcon = currentIcon + 1
    }, 200)
}
