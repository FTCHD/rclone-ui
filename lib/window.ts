import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import {
    LogicalSize,
    PhysicalPosition,
    PhysicalSize,
    currentMonitor,
    getAllWindows,
} from '@tauri-apps/api/window'
import { platform } from '@tauri-apps/plugin-os'
import { useStore } from './store'
import { getLoadingTray, getMainTray, getTrayRect } from './tray'

export async function resetMainWindow() {
    const window = await getAllWindows().then((w) => w.find((w) => w.label === 'main'))
    if (!window) return

    await window.setSize(new PhysicalSize(0, 0))
    await window.center()
    await window.hide()
    await window.setAlwaysOnTop(true)
}

export async function openFullWindow({
    name,
    url,
}: {
    name: string
    url: string
}) {
    const w = new WebviewWindow(name, {
        height: 0,
        width: 0,
        visibleOnAllWorkspaces: false,
        alwaysOnTop: false,
        resizable: true,
        visible: false,
        focus: true,
        title: name,
        decorations: true,
        url: url,
    })

    const size = await currentMonitor().then((m) => m?.size)

    if (!size) return

    if (platform() === 'windows') {
        // windows merges the space for the taskbar
        // subtract from the height to have it show
        size.height -= 100
    }

    await w.hide()
    await w.setSize(size)
    await w.center()
    await w.show()

    return w
}

export async function openWindow({
    name,
    url,
    width = 740,
    height = 600,
}: {
    name: string
    url: string
    width?: number
    height?: number
}) {
    const isFirstWindow = useStore.getState().firstWindow

    const w = new WebviewWindow(name, {
        height: 0,
        width: 0,
        resizable: false,
        visibleOnAllWorkspaces: false,
        alwaysOnTop: true,
        visible: false,
        // visible: platform() !== 'windows',
        focus: true,
        title: name,
        decorations: false,
        url: url,
        // parent: 'main',
    })

    await getMainTray().then((t) => t?.setVisible(false))
    await getLoadingTray().then((t) => t?.setVisible(true))
    await new Promise((resolve) => setTimeout(resolve, isFirstWindow ? 1000 : 150))
    await getLoadingTray().then((t) => t?.setVisible(false))
    await getMainTray().then((t) => t?.setVisible(true))

    // await w.hide()
    await w.setSize(new LogicalSize(width, height))
    await w.center()
    await w.setDecorations(true)
    await w.show()

    useStore.setState({ firstWindow: false })

    return w
}

export async function openTrayWindow({
    name,
    url,
}: {
    name: string
    url: string
}) {
    if (platform() === 'windows') {
        return await openWindow({ name, url })
    }

    const isFirstWindow = useStore.getState().firstWindow

    const w = new WebviewWindow(name, {
        height: 0,
        width: 0,
        resizable: false,
        visibleOnAllWorkspaces: true,
        alwaysOnTop: true,
        visible: true,
        focus: true,
        title: name,
        decorations: false,
        url: url,
    })

    // await getAllWindows()
    //     .then((w) => w.find((w) => w.label === 'main'))
    //     ?.then((w) => w?.setSize(new LogicalSize(400, 600)))

    await getMainTray().then((t) => t?.setVisible(false))
    await getLoadingTray().then((t) => t?.setVisible(true))
    await new Promise((resolve) => setTimeout(resolve, isFirstWindow ? 1000 : 150))
    await getLoadingTray().then((t) => t?.setVisible(false))
    await getMainTray().then((t) => t?.setVisible(true))

    await w.hide()

    const windowSize = new LogicalSize(400, 600)
    await w.setSize(windowSize)

    const trayRect = getTrayRect()
    const windowPhysicalSize = windowSize.toPhysical(await w.scaleFactor())
    await w.setPosition(
        new PhysicalPosition(
            trayRect.position.x + trayRect.size.width / 2 - windowPhysicalSize.width / 2,
            trayRect.position.y
        )
    )

    await w.show()

    await w.listen('tauri://blur', async () => {
        await w.destroy()
    })

    useStore.setState({ firstWindow: false })

    return w
}

export async function lockWindows(ids?: string[]) {
    const windows = await getAllWindows()
    const lockedWindows = ids ? windows.filter((w) => ids.includes(w.label)) : windows
    await Promise.all(lockedWindows.map((w) => w.setClosable(false)))
}

export async function unlockWindows(ids?: string[]) {
    const windows = await getAllWindows()
    const unlockedWindows = ids ? windows.filter((w) => ids.includes(w.label)) : windows
    await Promise.all(unlockedWindows.map((w) => w.setClosable(true)))
}
