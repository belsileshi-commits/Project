/* 
   STATE
    */
let tasks = [];
let currentFilter = "all";
let currentCategory = "all";
let searchQuery = "";
let lastDeleted = null;
let draggedId = null;

/* 
   DOM ELEMENTS
    */
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const clearCompletedBtn = document.getElementById("clearCompleted");
const filterBtns = document.querySelectorAll(".filter-btn");
const emptyState = document.getElementById("emptyState");
const emptySubtitle = document.getElementById("emptySubtitle");
const currentDate = document.getElementById("currentDate");
const priorityInput = document.getElementById("priorityInput");
const dueDateInput = document.getElementById("dueDateInput");
const categoryInput = document.getElementById("categoryInput");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const categoryFilters = document.getElementById("categoryFilters");
const themeToggle = document.getElementById("themeToggle");
const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
const closeHelp = document.getElementById("closeHelp");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const toastUndo = document.getElementById("toastUndo");
const menuToggle = document.getElementById("menuToggle");
const optionsMenu = document.getElementById("optionsMenu");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const clearAllBtn = document.getElementById("clearAllBtn");

/* 
   LOCAL STORAGE
    */
function save() {
    localStorage.setItem("belisti-tasks-v2", JSON.stringify(tasks));
    localStorage.setItem("belisti-theme", document.body.classList.contains("light") ? "light" : "dark");
}

function load() {
    const stored = localStorage.getItem("belisti-tasks-v2");
    if (stored) {
        try { tasks = JSON.parse(stored); } catch { tasks = []; }
    }

    const theme = localStorage.getItem("belisti-theme");
    if (theme === "light") {
        document.body.classList.add("light");
        themeToggle.textContent = "☀️";
    }
}

/* 
   UTILITIES
    */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDueStatus(dueDate) {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + "T00:00:00");

    const diff = (due - today) / (1000 * 60 * 60 * 24);

    if (diff < 0) return "overdue";
    if (diff === 0) return "today";
    return "future";
}

/* 
   ADD TASK
    */
function addTask() {
    const text = taskInput.value.trim();
    if (text === "") {
        taskInput.focus();
        return;
    }

    const newTask = {
        id: generateId(),
        text: text,
        completed: false,
        priority: priorityInput.value,
        dueDate: dueDateInput.value || null,
        category: categoryInput.value || null,
        createdAt: new Date().toISOString(),
    };

    tasks.unshift(newTask);
    save();
    render();
    resetInputs();
}

function resetInputs() {
    taskInput.value = "";
    dueDateInput.value = "";
    categoryInput.value = "";
    priorityInput.value = "medium";
    taskInput.focus();
}

/* 
   TOGGLE / DELETE / EDIT
    */
function toggleTask(id) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    save();
    render();
}

function deleteTask(id) {
    lastDeleted = tasks.find((t) => t.id === id);
    tasks = tasks.filter((t) => t.id !== id);
    save();
    render();
    showToast("Task deleted", true);
}

function startEdit(id) {
    document.querySelectorAll(".task-item.editing").forEach((el) => {
        el.classList.remove("editing");
    });

    const item = document.querySelector(`[data-id="${id}"]`);
    if (!item) return;

    item.classList.add("editing");

    const input = item.querySelector(".task-edit-input");
    if (input) {
        input.focus();
        input.select();
    }
}

function saveEdit(id, newText) {
    const trimmed = newText.trim();
    if (trimmed === "") {
        deleteTask(id);
        return;
    }

    tasks = tasks.map((t) => (t.id === id ? { ...t, text: trimmed } : t));
    save();
    render();
}

/* 
   CLEAR COMPLETED / ALL
    */
function clearCompleted() {
    const count = tasks.filter((t) => t.completed).length;
    if (count === 0) return;
    tasks = tasks.filter((t) => !t.completed);
    save();
    render();
    showToast(`${count} task${count > 1 ? "s" : ""} cleared`);
}

function clearAll() {
    if (tasks.length === 0) return;
    if (!confirm("Delete all tasks? This cannot be undone.")) return;
    tasks = [];
    save();
    render();
    showToast("All tasks cleared");
}

/* 
   FILTERS
    */
function getFilteredTasks() {
    let filtered = [...tasks];

    if (currentFilter === "active") filtered = filtered.filter((t) => !t.completed);
    else if (currentFilter === "completed") filtered = filtered.filter((t) => t.completed);

    if (currentCategory !== "all") filtered = filtered.filter((t) => t.category === currentCategory);

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
            (t) =>
                t.text.toLowerCase().includes(q) ||
                (t.category && t.category.toLowerCase().includes(q))
        );
    }

    return filtered;
}

/* 
   RENDER
    */
function render() {
    const filtered = getFilteredTasks();
    taskList.innerHTML = "";

    if (filtered.length === 0) {
        emptyState.classList.add("show");
        if (searchQuery) {
            emptySubtitle.textContent = `No results for "${searchQuery}"`;
        } else if (currentFilter === "completed") {
            emptySubtitle.textContent = "No completed tasks yet";
        } else if (currentFilter === "active") {
            emptySubtitle.textContent = "All tasks done! 🎉";
        } else {
            emptySubtitle.textContent = "Add your first task to get started";
        }
    } else {
        emptyState.classList.remove("show");
    }

    filtered.forEach((task) => {
        const li = document.createElement("li");
        li.className = "task-item" + (task.completed ? " completed" : "");
        li.dataset.id = task.id;
        li.dataset.priority = task.priority || "medium";
        li.draggable = true;

        const dueStatus = getDueStatus(task.dueDate);

        let metaHtml = "";
        if (task.category) {
            metaHtml += `<span class="tag tag-category">${escapeHtml(task.category)}</span>`;
        }
        if (task.dueDate) {
            const statusClass = dueStatus === "overdue" ? "overdue" : dueStatus === "today" ? "today" : "";
            const label = dueStatus === "overdue" ? "⚠️" : dueStatus === "today" ? "📌" : "📅";
            metaHtml += `<span class="tag tag-due ${statusClass}">${label} ${formatDate(task.dueDate)}</span>`;
        }

        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}>
            <div class="task-content">
                <span class="task-text">${escapeHtml(task.text)}</span>
                <input type="text" class="task-edit-input" value="${escapeHtml(task.text)}" maxlength="140">
                ${metaHtml ? `<div class="task-meta-info">${metaHtml}</div>` : ""}
            </div>
            <div class="task-actions">
                <button class="icon-btn edit" title="Edit">✏️</button>
                <button class="icon-btn delete" title="Delete">🗑️</button>
            </div>
        `;

        // Events
        li.querySelector(".task-checkbox").addEventListener("change", () => toggleTask(task.id));
        li.querySelector(".icon-btn.edit").addEventListener("click", () => startEdit(task.id));
        li.querySelector(".icon-btn.delete").addEventListener("click", () => deleteTask(task.id));

        const editInput = li.querySelector(".task-edit-input");

        li.querySelector(".task-text").addEventListener("dblclick", () => startEdit(task.id));

        editInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") saveEdit(task.id, editInput.value);
            else if (e.key === "Escape") render();
        });

        editInput.addEventListener("blur", () => {
            if (li.classList.contains("editing")) saveEdit(task.id, editInput.value);
        });

        // Drag & drop
        li.addEventListener("dragstart", () => {
            draggedId = task.id;
            li.classList.add("dragging");
        });

        li.addEventListener("dragend", () => {
            li.classList.remove("dragging");
            document.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
        });

        li.addEventListener("dragover", (e) => {
            e.preventDefault();
            if (draggedId !== task.id) li.classList.add("drag-over");
        });

        li.addEventListener("dragleave", () => li.classList.remove("drag-over"));

        li.addEventListener("drop", (e) => {
            e.preventDefault();
            li.classList.remove("drag-over");
            reorderTasks(draggedId, task.id);
        });

        taskList.appendChild(li);
    });

    updateStats();
    updateProgress();
    renderCategoryFilters();
}

/* 
   REORDER (Drag & Drop)
    */
function reorderTasks(fromId, toId) {
    if (fromId === toId) return;
    const fromIndex = tasks.findIndex((t) => t.id === fromId);
    const toIndex = tasks.findIndex((t) => t.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = tasks.splice(fromIndex, 1);
    tasks.splice(toIndex, 0, moved);
    save();
    render();
}

/* 
   STATS
    */
function updateStats() {
    const total = tasks.length;
    const active = tasks.filter((t) => !t.completed).length;
    const done = total - active;

    if (total === 0) {
        taskCount.textContent = "0 tasks";
    } else if (active === 0) {
        taskCount.textContent = `All done · ${total} completed 🎉`;
    } else {
        taskCount.textContent = `${active} active · ${done} done · ${total} total`;
    }
}

function updateProgress() {
    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    progressFill.style.width = percent + "%";
    progressText.textContent = `${percent}% completed`;
}

/* 
   CATEGORY CHIPS
    */
function renderCategoryFilters() {
    const categories = ["all", ...new Set(tasks.map((t) => t.category).filter(Boolean))];

    categoryFilters.innerHTML = "";

    if (categories.length <= 1) return;

    categories.forEach((cat) => {
        const chip = document.createElement("button");
        chip.className = "category-chip" + (currentCategory === cat ? " active" : "");
        chip.textContent = cat === "all" ? "All categories" : cat;
        chip.addEventListener("click", () => {
            currentCategory = cat;
            render();
        });
        categoryFilters.appendChild(chip);
    });
}

/* 
   TOAST
    */
let toastTimer = null;

function showToast(message, canUndo = false) {
    toastMessage.textContent = message;
    toastUndo.hidden = !canUndo;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}

function undoDelete() {
    if (!lastDeleted) return;
    tasks.unshift(lastDeleted);
    lastDeleted = null;
    save();
    render();
    toast.classList.remove("show");
}

/* 
   EXPORT / IMPORT
    */
function exportTasks() {
    const data = JSON.stringify(tasks, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Tasks exported ✓");
}

function importTasks(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) throw new Error("Invalid format");
            tasks = [...imported, ...tasks];
            save();
            render();
            showToast(`Imported ${imported.length} tasks`);
        } catch {
            showToast("Import failed — invalid file");
        }
    };
    reader.readAsText(file);
}

/* 
   DATE DISPLAY
    */
function displayDate() {
    currentDate.textContent = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

/* 
   EVENT LISTENERS
    */
addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", (e) => e.key === "Enter" && addTask());

clearCompletedBtn.addEventListener("click", clearCompleted);

filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        render();
    });
});

searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    clearSearch.hidden = !searchQuery;
    render();
});

clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    clearSearch.hidden = true;
    render();
});

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");
    themeToggle.textContent = isLight ? "☀️" : "🌙";
    save();
});

helpBtn.addEventListener("click", () => helpModal.classList.add("open"));
closeHelp.addEventListener("click", () => helpModal.classList.remove("open"));
helpModal.addEventListener("click", (e) => {
    if (e.target === helpModal) helpModal.classList.remove("open");
});

toastUndo.addEventListener("click", undoDelete);

menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    optionsMenu.classList.toggle("open");
});

document.addEventListener("click", (e) => {
    if (!optionsMenu.contains(e.target) && e.target !== menuToggle) {
        optionsMenu.classList.remove("open");
    }
});

exportBtn.addEventListener("click", () => {
    exportTasks();
    optionsMenu.classList.remove("open");
});

importBtn.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", (e) => {
    if (e.target.files[0]) importTasks(e.target.files[0]);
    e.target.value = "";
    optionsMenu.classList.remove("open");
});

clearAllBtn.addEventListener("click", () => {
    clearAll();
    optionsMenu.classList.remove("open");
});

/* 
   KEYBOARD SHORTCUTS
    */
document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        searchInput.focus();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        themeToggle.click();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "z" && lastDeleted) {
        e.preventDefault();
        undoDelete();
    } else if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        taskInput.focus();
    } else if (e.key === "Escape") {
        helpModal.classList.remove("open");
        optionsMenu.classList.remove("open");
    }
});

/* 
   INIT
    */
load();
render();
displayDate();