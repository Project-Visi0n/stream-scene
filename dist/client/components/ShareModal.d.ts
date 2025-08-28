import React from 'react';
import { ShareRecord } from '../services/shareService';
interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileId: number;
    fileName: string;
    onShareCreated?: (share: ShareRecord) => void;
}
declare const ShareModal: React.FC<ShareModalProps>;
export default ShareModal;
//# sourceMappingURL=ShareModal.d.ts.map