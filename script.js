let tasks = [];

window.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderApp();
    
    document.getElementById('task-form').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarOuAtualizarTarefa();
    });

    document.getElementById('btn-cancel').addEventListener('click', resetForm);
    document.getElementById('btn-clear-filters').addEventListener('click', clearFilters);

    document.getElementById('search-input').addEventListener('input', renderApp);
    document.getElementById('filter-priority').addEventListener('change', renderApp);
    document.getElementById('filter-status').addEventListener('change', renderApp);
});

function loadTasks() {
    try {
        const stored = localStorage.getItem('taskflow_tasks');
        tasks = stored ? JSON.parse(stored) : [];
    } catch (err) {
        tasks = [];
    }
}

function saveTasks() {
    localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
}

function salvarOuAtualizarTarefa() {
    const idInput = document.getElementById('task-id');
    const titleInput = document.getElementById('task-title');
    const descInput = document.getElementById('task-desc');
    const priorityInput = document.getElementById('task-priority');
    const deadlineInput = document.getElementById('task-deadline');
    const statusInput = document.getElementById('task-status-input');

    const title = titleInput.value.trim();
    if (!title) {
        alert('Por favor, insira o título da tarefa.');
        return;
    }

    const id = idInput.value;
    const description = descInput.value.trim();
    const priority = priorityInput.value;
    const deadline = deadlineInput.value;
    const status = statusInput.value;

    if (id) {
        const index = tasks.findIndex(t => String(t.id) === String(id));
        if (index !== -1) {
            tasks[index].title = title;
            tasks[index].description = description;
            tasks[index].priority = priority;
            tasks[index].deadline = deadline;
            tasks[index].status = status;
        }
    } else {
        const novaTarefa = {
            id: 'task_' + Date.now(),
            title: title,
            description: description,
            priority: priority,
            deadline: deadline,
            status: status 
        };
        tasks.push(novaTarefa);
    }

    saveTasks();
    resetForm();
    renderApp();
}

function changeStatus(taskId, newStatus) {
    const task = tasks.find(t => String(t.id) === String(taskId));
    if (task) {
        task.status = newStatus;
        saveTasks();
        renderApp();
    }
}

function deleteTask(taskId) {
    if (confirm('Tem a certeza que deseja eliminar esta tarefa?')) {
        tasks = tasks.filter(t => String(t.id) !== String(taskId));
        saveTasks();
        renderApp();
    }
}

function editTask(taskId) {
    const task = tasks.find(t => String(t.id) === String(taskId));
    if (task) {
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-deadline').value = task.deadline;
        document.getElementById('task-status-input').value = task.status;
        
        document.getElementById('btn-cancel').style.display = 'inline-flex';
        document.getElementById('form-title').textContent = 'Editar Tarefa';
        document.getElementById('btn-save').textContent = '✓ Atualizar Tarefa';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function resetForm() {
    document.getElementById('task-id').value = '';
    document.getElementById('task-form').reset();
    document.getElementById('task-status-input').value = 'todo';
    document.getElementById('btn-cancel').style.display = 'none';
    document.getElementById('form-title').textContent = 'Nova Tarefa';
    document.getElementById('btn-save').textContent = '+ Salvar Tarefa';
}

function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-priority').value = '';
    document.getElementById('filter-status').value = '';
    renderApp();
}

// --- FUNÇÕES DE DRAG AND DROP (ARRASTAR E SOLTAR) ---
function drag(ev, taskId) {
    ev.dataTransfer.setData("text/plain", taskId);
}

function allowDrop(ev) {
    ev.preventDefault();
}

function dropTask(ev, newStatus) {
    ev.preventDefault();
    const taskId = ev.dataTransfer.getData("text/plain");
    if (taskId) {
        changeStatus(taskId, newStatus);
    }
}

function renderApp() {
    document.getElementById('total-tasks').textContent = tasks.length;
    document.getElementById('pending-tasks').textContent = tasks.filter(t => t.status === 'todo').length;
    document.getElementById('progress-tasks').textContent = tasks.filter(t => t.status === 'in_progress').length;
    document.getElementById('completed-tasks').textContent = tasks.filter(t => t.status === 'done').length;

    const listTodo = document.getElementById('list-todo');
    const listInProgress = document.getElementById('list-in-progress');
    const listDone = document.getElementById('list-done');

    if (!listTodo || !listInProgress || !listDone) return;

    listTodo.innerHTML = '';
    listInProgress.innerHTML = '';
    listDone.innerHTML = '';

    const search = document.getElementById('search-input').value.toLowerCase();
    const selPriority = document.getElementById('filter-priority').value;
    const selStatus = document.getElementById('filter-status').value;

    const filtered = tasks.filter(task => {
        const matchesSearch = !search || task.title.toLowerCase().includes(search);
        const matchesPriority = !selPriority || task.priority === selPriority;
        const matchesStatus = !selStatus || task.status === selStatus;
        return matchesSearch && matchesPriority && matchesStatus;
    });

    filtered.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.setAttribute('draggable', 'true'); // Permite arrastar o cartão com o rato
        card.addEventListener('dragstart', (ev) => drag(ev, task.id));
        
        card.innerHTML = `
            <h4>${escapeHtml(task.title)}</h4>
            <p>${escapeHtml(task.description || 'Sem descrição')}</p>
            <div class="task-meta-bar">
                <span class="priority-tag tag-${task.priority}">${task.priority}</span>
                <span class="deadline-tag">📅 ${task.deadline || 'Sem prazo'}</span>
            </div>
            <div class="task-actions-row">
                ${task.status !== 'todo' ? `<button type="button" class="action-todo">← A Fazer</button>` : ''}
                ${task.status !== 'in_progress' ? `<button type="button" class="action-progress">Em Andamento</button>` : ''}
                ${task.status !== 'done' ? `<button type="button" class="action-done">Concluído →</button>` : ''}
                <button type="button" class="action-edit">Editar</button>
                <button type="button" class="action-del btn-del">Excluir</button>
            </div>
        `;

        const btnTodo = card.querySelector('.action-todo');
        if (btnTodo) btnTodo.addEventListener('click', () => changeStatus(task.id, 'todo'));

        const btnProgress = card.querySelector('.action-progress');
        if (btnProgress) btnProgress.addEventListener('click', () => changeStatus(task.id, 'in_progress'));

        const btnDone = card.querySelector('.action-done');
        if (btnDone) btnDone.addEventListener('click', () => changeStatus(task.id, 'done'));

        const btnEdit = card.querySelector('.action-edit');
        if (btnEdit) btnEdit.addEventListener('click', () => editTask(task.id));

        const btnDel = card.querySelector('.action-del');
        if (btnDel) btnDel.addEventListener('click', () => deleteTask(task.id));

        if (task.status === 'todo') listTodo.appendChild(card);
        else if (task.status === 'in_progress') listInProgress.appendChild(card);
        else if (task.status === 'done') listDone.appendChild(card);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}