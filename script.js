const priorityButtons = document.querySelectorAll('[data-priority].priority-filter button, .priority-filter button');
const scenarioItems = document.querySelectorAll('.scenario-item');

document.querySelectorAll('.priority-filter button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.priority-filter button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    const priority = button.dataset.priority;
    scenarioItems.forEach((item) => { item.hidden = priority !== 'all' && item.dataset.priority !== priority; });
  });
});

document.querySelectorAll('.flow-tabs button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.flow-tabs button').forEach((item) => { item.classList.remove('active'); item.setAttribute('aria-selected', 'false'); });
    document.querySelectorAll('.core-flow').forEach((panel) => panel.classList.remove('active'));
    button.classList.add('active');
    button.setAttribute('aria-selected', 'true');
    document.querySelector(`[data-panel="${button.dataset.flow}"]`).classList.add('active');
  });
});
