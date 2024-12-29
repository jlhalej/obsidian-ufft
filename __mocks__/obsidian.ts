export class TAbstractFile {
    path: string;
    name: string;
    parent: TFolder | null;
    vault: Vault;
}

export class TFile extends TAbstractFile {
    stat: { size: number; ctime: number; mtime: number };
    basename: string;
    extension: string;
}

export class TFolder extends TAbstractFile {
    children: TAbstractFile[];
}

export class App {
    vault: Vault;
}

export class Vault {
    getAbstractFileByPath(path: string): TAbstractFile | null {
        return null;
    }

    async read(file: TFile): Promise<string> {
        return '';
    }

    async modify(file: TFile, data: string): Promise<void> {}
}

export class Notice {
    constructor(message: string) {}
}
