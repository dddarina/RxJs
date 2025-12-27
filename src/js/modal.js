import { escapeHtml, safeHtml, formatDate, extractSenderName } from './utils.js';

const modalState = {
    modal: null,
    closeHandlers: new Map()
};

export function showMessageModal(message) {
    const modal = getOrCreateModal();
    
    updateModalContent(modal, message);
    
    showModal(modal);
}

function getOrCreateModal() {
    if (modalState.modal) {
        cleanupModalEventListeners(modalState.modal);
        return modalState.modal;
    }
    
    const modal = document.createElement('div');
    modal.id = 'message-modal';
    modal.className = 'modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    
    document.body.append(modal);
    modalState.modal = modal;
    
    return modal;
}

function updateModalContent(modal, message) {
    const senderName = extractSenderName(message.from);
    const formattedDate = message.formattedDate || formatDate(message.received);
    const subject = message.originalSubject || message.subject || '(без темы)';
    
    modal.innerHTML = `
        <div class="modal-content" role="document">
            <div class="modal-header">
                <h3 id="modal-title">${escapeHtml(subject)}</h3>
                <button class="modal-close" aria-label="Закрыть окно">&times;</button>
            </div>
            <div class="modal-body">
                <div class="message-meta">
                    <div class="meta-item">
                        <strong>От:</strong>
                        <div class="sender-info">
                            <div class="sender-name">${escapeHtml(senderName)}</div>
                            <div class="sender-email">${escapeHtml(message.from)}</div>
                        </div>
                    </div>
                    <div class="meta-item">
                        <strong>Дата:</strong>
                        <span>${escapeHtml(formattedDate)}</span>
                    </div>
                </div>
                <div class="message-content">${safeHtml(message.body)}</div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close-btn">Закрыть</button>
            </div>
        </div>
    `;
    
    setupModalEventListeners(modal);
}

function setupModalEventListeners(modal) {
    if (!modal) return;
    
    const closeButtons = modal.querySelectorAll('.modal-close, .modal-close-btn');
    closeButtons.forEach(btn => {
        const handler = () => hideModal();
        btn.addEventListener('click', handler);
        modalState.closeHandlers.set(btn, { type: 'click', handler });
    });
    
    const outsideClickHandler = (e) => {
        if (e.target === modal) hideModal();
    };
    modal.addEventListener('click', outsideClickHandler);
    modalState.closeHandlers.set(modal, { type: 'click', handler: outsideClickHandler });
    
    const escapeHandler = (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            hideModal();
        }
    };
    document.addEventListener('keydown', escapeHandler);
    modalState.closeHandlers.set(document, { type: 'keydown', handler: escapeHandler });
    
    trapFocusInsideModal(modal);
}

function trapFocusInsideModal(modal) {
    const focusableSelectors = [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    
    const focusableElements = modal.querySelectorAll(focusableSelectors);
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const trapHandler = (e) => {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    };
    
    modal.addEventListener('keydown', trapHandler);
    modalState.closeHandlers.set(modal, { 
        type: 'keydown', 
        handler: trapHandler,
        isFocusTrap: true 
    });
}

function cleanupModalEventListeners(modal) {
    modalState.closeHandlers.forEach(({ type, handler }, element) => {
        element.removeEventListener(type, handler);
    });
    modalState.closeHandlers.clear();
}

function showModal(modal) {
    if (!modal) return;
    
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) closeBtn.focus();
    }, 50);
}

export function hideModal() {
    const modal = modalState.modal;
    if (!modal || !modal.classList.contains('active')) return;
    
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    const activeElement = document.activeElement;
    setTimeout(() => {
        if (activeElement && activeElement.tagName === 'BUTTON') {
            activeElement.focus();
        }
    }, 10);
}

export function cleanupModal() {
    hideModal();
    cleanupModalEventListeners(modalState.modal);
    
    if (modalState.modal && modalState.modal.parentNode) {
        modalState.modal.parentNode.removeChild(modalState.modal);
    }
    
    modalState.modal = null;
    modalState.closeHandlers.clear();
}