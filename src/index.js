import './css/style.css';
import { MessageWidget } from './js/MessageWidget.js';

document.addEventListener('DOMContentLoaded', () => {
    window.messageWidget = new MessageWidget();
});

window.addEventListener('beforeunload', () => {
    if (window.messageWidget && typeof window.messageWidget.destroy === 'function') {
        window.messageWidget.destroy();
    }
});