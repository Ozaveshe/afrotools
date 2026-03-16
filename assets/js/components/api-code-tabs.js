/* AfroTools API Docs — Code Tab Switcher */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.code-block-wrapper').forEach(wrapper => {
    const tabs = wrapper.querySelectorAll('.code-tab');
    const panels = wrapper.querySelectorAll('.code-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('code-tab--active'));
        panels.forEach(p => p.classList.remove('code-panel--active'));
        tab.classList.add('code-tab--active');
        const target = wrapper.querySelector(`[data-lang="${tab.dataset.lang}"]`);
        if (target) target.classList.add('code-panel--active');
      });
    });
  });
});
