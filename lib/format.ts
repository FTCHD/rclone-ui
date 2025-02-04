export function formatBytes(bytes: number) {
    // format bytes in to a readable format like (MB, GB, etc), depending on how big the number is
    if (bytes < 1024) {
        return `${bytes} B`
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`
    }

    if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`
    }

    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export function replaceSmartQuotes(value: string) {
    const replacements: { [key: string]: string } = {
        '‘': "'",
        '’': "'",
        '‚': "'",
        '“': '"',
        '”': '"',
        '„': '"',
    }
    return value.replace(/[‘’‚“”„]/g, (match) => replacements[match])
}

export function getRemoteName(path?: string) {
    if (!path?.includes(':')) return null // Return null for local paths
    return path.split(':')[0]
}
