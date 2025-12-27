export function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

export function safeHtml(text) {
    if (text == null) return '';
    const escaped = escapeHtml(text);
    return escaped.replace(/\n/g, '<br>');
}

export function formatDate(timestamp) {
    let date;
    
    if (timestamp < 10000000000) {
        date = new Date(timestamp * 1000);
    } else {
        date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return 'Неизвестная дата';
    }
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${hours}:${minutes} ${day}.${month}.${year}`;
}

export function truncateSubject(subject, maxLength = 15) {
    if (!subject || typeof subject !== 'string') return '';
    
    return subject.length > maxLength 
        ? subject.substring(0, maxLength) + '...' 
        : subject;
}

export function extractSenderName(email) {
    if (!email || typeof email !== 'string') return 'Неизвестный';
    
    try {
        const emailPart = email.split('@')[0] || '';
        return emailPart
            .split(/[._-]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    } catch (error) {
        console.warn('Error extracting sender name from email:', email, error);
        return 'Неизвестный';
    }
}

export function createMessageRow(message, isNew = false) {
    const row = document.createElement('tr');
    if (isNew) {
        row.className = 'new-message';
    }
    row.dataset.id = escapeHtml(message.id);
    row.dataset.messageId = escapeHtml(message.id);
    
    const senderName = extractSenderName(message.from);
    
    row.innerHTML = `
        <td class="sender">
            <i class="fas fa-user-circle"></i>
            <div class="sender-details">
                <div class="sender-name">${escapeHtml(senderName)}</div>
                <div class="sender-email" title="${escapeHtml(message.from)}">${escapeHtml(message.from)}</div>
            </div>
        </td>
        <td class="subject">
            <span class="subject-text" title="${escapeHtml(message.subject)}">
                ${escapeHtml(message.truncatedSubject || truncateSubject(message.subject))}
            </span>
        </td>
        <td class="date">
            ${escapeHtml(message.formattedDate || formatDate(message.received))}
        </td>
    `;
    
    return row;
}

export function createEmptyState() {
    const row = document.createElement('tr');
    row.className = 'empty-state';
    row.innerHTML = `
        <td colspan="3">
            <i class="fas fa-envelope-open"></i>
            <p>Нет сообщений</p>
        </td>
    `;
    return row;
}

export function updateStats(total, newCount, lastUpdate) {
    const elements = {
        total: document.getElementById('total-messages'),
        new: document.getElementById('new-messages'),
        last: document.getElementById('last-update')
    };
    
    if (elements.total) {
        elements.total.textContent = total;
        elements.total.classList.add('updated');
        setTimeout(() => elements.total.classList.remove('updated'), 500);
    }
    
    if (elements.new) {
        if (newCount > 0) {
            elements.new.textContent = newCount;
            elements.new.classList.add('has-new');
            elements.new.parentElement?.classList?.add('has-new');
            
            if (elements.new.style) {
                elements.new.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    if (elements.new.style) {
                        elements.new.style.transform = 'scale(1)';
                    }
                }, 300);
            }
        } else {
            elements.new.textContent = '0';
            elements.new.classList.remove('has-new');
            elements.new.parentElement?.classList?.remove('has-new');
        }
    }
    
    if (elements.last) {
        elements.last.textContent = lastUpdate || '—';
        elements.last.classList.add('updated');
        setTimeout(() => elements.last.classList.remove('updated'), 500);
    }
}

export function setLoading(isLoading) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.classList.toggle('active', isLoading);
    }
}

export function setError(hasError) {
    const errorEl = document.getElementById('error');
    if (errorEl) {
        errorEl.classList.toggle('active', hasError);
    }
}