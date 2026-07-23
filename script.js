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

const mapNodes = document.querySelectorAll('.map-node');
const mapDetailType = document.getElementById('mapDetailType');
const mapDetailTitle = document.getElementById('mapDetailTitle');
const mapDetailText = document.getElementById('mapDetailText');

mapNodes.forEach((node) => {
  node.addEventListener('click', () => {
    mapNodes.forEach((item) => item.classList.remove('selected'));
    node.classList.add('selected');
    mapDetailType.textContent = node.dataset.type;
    mapDetailTitle.textContent = node.dataset.title;
    mapDetailText.textContent = node.dataset.text;
  });
});
