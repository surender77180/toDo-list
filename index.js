function createItem(taskItem) {
    const { task, id, isDone } = taskItem;
    const item = document.createElement("li");
    item.id = id;
    item.isDone = isDone;
    item.innerHTML = `<form>
                          <span style="text-decoration: underline">${task}</span>
                          <div>
                            <input type="checkbox" class="checkbox"/>
                            <button type="submit" class="del-btn">X
                            </button>
                            </div>
                      </form>`;
    return item;
}


function markTask(condition, taskElem) {
    if (condition) {
        taskElem.style.setProperty("text-decoration", "line-through");
    } else {
        taskElem.style.setProperty("text-decoration", "color: red");
    }
}

function applyIteractions(item) {
    const taskElem = item.querySelector("span");
    const chboxElem = item.querySelector("input");
    const btnElem = item.querySelector("button");

    let isDone = JSON.parse(item.isDone);

    markTask(isDone, taskElem);

    chboxElem.addEventListener("click", () => {
        isDone = !isDone;
        const id = item.id;
        fetch(`/item?id=${id}&isDone=${isDone}`, { method: "POST" })
            .then(() => {
                markTask(isDone, taskElem);
            });
    });

    btnElem.addEventListener("click", (eve) => {
        eve.preventDefault();
        const id = item.id;
        fetch(`/item?id=${id}`, { method: "DELETE" })
            .then(() => {
                fetchAndShowList();
            });

    });
}

function addItem(taskListElem, task) {
    fetch(`/item?task=${task}`, { method: "PUT" })
        .then(() => {
            fetchAndShowList();
        });
}


const formElem = document.getElementById("form_task");
const taskListElem = document.getElementById("task_list");

formElem.addEventListener("submit", (eve) => {
    eve.preventDefault();

    const formData = new FormData(formElem);
    addItem(taskListElem, formData.get("task"));

    formElem.reset();
});


function fetchAndShowList() {
    fetch("/items")
        .then(res => res.json())
        .then(list => {
            taskListElem.innerHTML = "";
            for (const id in list) {
                const taskItem = list[id];
                const item = createItem(taskItem);
                applyIteractions(item);
                taskListElem.appendChild(item);
            }
        });
}

fetchAndShowList();

const usernameElem = document.getElementById("username");
// const logoutButton = document.getElementById("logout");

fetch("/getuser")
.then(res=> res.text())
.then(username=> {
    usernameElem.textContent= username.charAt(0).toUpperCase()+ username.slice(1);
});
// logoutButton.onclick=()=>{
//    location.href="/logout"
// }