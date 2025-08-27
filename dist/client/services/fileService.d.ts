export interface FileRecord {
    id: number;
    userId: number;
    name: string;
    originalName: string;
    type: string;
    size: number;
    s3Key?: string;
    url: string;
    uploadedAt: string;
    updatedAt: string;
}
export interface CreateFileRequest {
    name: string;
    originalName?: string;
    type: string;
    size: number;
    s3Key?: string;
    url: string;
}
export declare const fileService: {
    getFiles(): Promise<FileRecord[]>;
    createFile(fileData: CreateFileRequest): Promise<FileRecord>;
    getFile(id: number): Promise<FileRecord>;
    deleteFile(id: number): Promise<void>;
    updateFile(id: number, updates: Partial<Pick<FileRecord, "name">>): Promise<FileRecord>;
};
//# sourceMappingURL=fileService.d.ts.map