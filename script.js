let tasks = JSON.parse(localStorage.getItem('nurTasks')) || { high: [], medium: [], low: [] };
let completed = JSON.parse(localStorage.getItem('nurCompleted')) || [];
let timeLeft = 25 * 60; 
let initialSetTime = 25 * 60;
let timerId = null;
let currentTask = null;
let isBreak = false;

const countdown = document.getElementById('countdown');
const statusText = document.getElementById('focus-status');
const taskDisplay = document.getElementById('active-task-display');

// --- THEME LOGIC ---
const themeBtn = document.getElementById('theme-toggle-btn');
themeBtn.addEventListener('click', () => 
    {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('nurTheme', isLight ? 'light' : 'dark');
    });

if (localStorage.getItem('nurTheme') === 'light') 
    {
        document.body.classList.add('light-mode');
    }

// --- STATS & RENDER ---
function updateStats() 
{
    const pCount = tasks.high.length + tasks.medium.length + tasks.low.length;
    const cCount = completed.length;
    document.getElementById('stat-total').innerText = pCount + cCount;
    document.getElementById('stat-pending').innerText = pCount;
    document.getElementById('stat-completed').innerText = cCount;
}

function render() 
{
    ['high', 'medium', 'low'].forEach(p => 
        {
            const list = document.getElementById(`${p}-list`);
            if (!list) return;
            list.innerHTML = '';
            tasks[p].forEach((task, index) => 
                {
                    const card = document.createElement('div');
                    card.className = 'task-card';
                    card.innerHTML = `
                        <strong>${task}</strong>
                        <button class="focus-btn" onclick="prepTask('${task.replace(/'/g, "\\'")}', ${index}, '${p}')">🎯 Focus Mission</button>
                        <button class="del-btn" onclick="deleteTask('${p}', ${index})">Discard</button>
                                    `;
                    list.appendChild(card);
                });
        });
    document.getElementById('completed-list').innerHTML = completed.map(t => `<span class="done-task">${t}</span>`).join('');
    updateStats();
}

// --- TASK LOGIC ---
document.getElementById('task-form').addEventListener('submit', (e) => 
    {
        e.preventDefault();
        const input = document.getElementById('task-input');
        const priority = document.getElementById('priority-input').value;
        if (!input.value.trim()) return;
        tasks[priority].push(input.value.trim());
        localStorage.setItem('nurTasks', JSON.stringify(tasks));
        input.value = '';
        render();
    });

function deleteTask(p, i) 
{
    tasks[p].splice(i, 1);
    localStorage.setItem('nurTasks', JSON.stringify(tasks));
    render();
}

window.prepTask = (name, index, priority) => 
    {
        currentTask = { name, index, priority };
        taskDisplay.innerHTML = `Current Mission: <span style="color:#f59e0b">${name}</span>`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

// --- TIMER LOGIC ---
function updateUI() 
{
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    countdown.innerText = `${m}:${s.toString().padStart(2, '0')}`;
}

document.getElementById('time-up').addEventListener('click', () => 
    {
        if (timerId) return;
        timeLeft += 300; 
        initialSetTime = timeLeft; 
        updateUI();
    });

document.getElementById('time-down').addEventListener('click', () => 
    {
        if (timerId || timeLeft <= 300) return;
        timeLeft -= 300; 
        initialSetTime = timeLeft; 
        updateUI();
    });

function startTimer() 
{
    if (timerId || !currentTask) return !currentTask ? alert("Select a mission card first, bro!") : null;

    document.body.style.backgroundColor = "#020617"; // Focus Blackout
    statusText.innerText = isBreak ? "POMODORO BREAK ON" : "FOCUS MODE";

    timerId = setInterval(() => 
        {
            if (timeLeft > 0) 
                {
                    timeLeft--;
                    updateUI();
                    if (!isBreak && initialSetTime >= 1800 && timeLeft === (initialSetTime - 1500)) 
                        {
                            clearInterval(timerId); timerId = null;
                            isBreak = true; timeLeft = 300; 
                            alert("25 mins done! Time for a break.");
                            startTimer();
                        }
                } 
            else 
                {
                    clearInterval(timerId); timerId = null;
                    if (isBreak) 
                        {
                            isBreak = false; timeLeft = (initialSetTime - 1500); 
                            alert("Break over! Back to the mission."); 
                            startTimer();
                        } 
                    else 
                        {
                            document.getElementById('verify-modal').classList.remove('hidden');
                        }
                }
        }, 1000);
}

// --- MODAL & CONTROLS ---
document.getElementById('btn-yes').addEventListener('click', () => 
    {
        completed.push(currentTask.name);
        tasks[currentTask.priority].splice(currentTask.index, 1);
        localStorage.setItem('nurTasks', JSON.stringify(tasks));
        localStorage.setItem('nurCompleted', JSON.stringify(completed));
        document.getElementById('verify-modal').classList.add('hidden');
        document.getElementById('victory-overlay').classList.remove('hidden');
        render();
    });

document.getElementById('btn-no').addEventListener('click', () => 
    {
        document.getElementById('verify-modal').classList.add('hidden');
        timeLeft = 300; updateUI();
    });

document.getElementById('close-victory-btn').addEventListener('click', () => 
    {
        document.getElementById('victory-overlay').classList.add('hidden');
        document.body.style.backgroundColor = ""; 
        timeLeft = 25 * 60; initialSetTime = 25 * 60;
        currentTask = null; taskDisplay.innerText = "Select a mission to begin";
        updateUI(); 
    });

document.getElementById('start-btn').addEventListener('click', startTimer);

document.getElementById('pause-btn').addEventListener('click', () => 
    {
        clearInterval(timerId); timerId = null;
        statusText.innerText = "SESSION PAUSED";
        document.body.style.backgroundColor = ""; 
    });

document.getElementById('reset-btn').addEventListener('click', () => 
    {
        if(confirm("Reset everything?")) location.reload();
    });

setInterval(() => 
    {
        document.getElementById('digital-clock').innerText = new Date().toLocaleTimeString();
    }, 1000);

render();