// Fallback for updateBudgetAccordionTotals if not defined
if (typeof updateBudgetAccordionTotals !== 'function') {
  function updateBudgetAccordionTotals() {}
}
//transport.js
//===============================TRANSPORT LOCK/UNLOCK LOGIC=============================
// Lock/unlock all editable fields in the Transport section for Budget Categories Accordion
function toggleLockTransport() {
  const lockBtn = document.getElementById('lock-transport');
  const lockIcon = document.getElementById('lock-transport-icon');
  const panel = lockBtn.closest('.budui-accordion-panel');
  const editFields = panel.querySelectorAll('input:not([type="number"])');
  const halfFields = panel.querySelectorAll('.budui-half');
  const totalFields = panel.querySelectorAll('.budui-total');
  const isLocked = lockBtn.dataset.locked === 'true';

  if (!isLocked) {
    // Lock all fields
    editFields.forEach(f => {
      f.setAttribute('disabled', 'disabled');
      f.blur();
    });
    halfFields.forEach(f => {
      f.setAttribute('readonly', 'readonly');
    });
    totalFields.forEach(f => {
      f.setAttribute('readonly', 'readonly');
    });
    lockBtn.dataset.locked = 'true';
    lockIcon.textContent = '🔒';
    lockBtn.title = 'Unlock Fields';
    // Hide placeholder blocks and force 'Sub-category' on empty, and always hide all 'Sub-category' blocks after locking
    panel.querySelectorAll('.budui-block').forEach(block => {
      const labelInput = block.querySelector('.budui-edit-category-label');
      if (labelInput) {
        if (!labelInput.value || labelInput.value.trim() === '') {
          labelInput.value = 'Sub-category';
        }
        if (labelInput.value.trim().toLowerCase() === 'sub-category') {
          block.style.display = 'none';
        } else {
          block.style.display = '';
        }
      }
      // Update sub-category total on lock
      const first = block.querySelectorAll('.budui-half')[0];
      const second = block.querySelectorAll('.budui-half')[1];
      const totalField = block.querySelector('.budui-total');
      if (first && second && totalField) {
        // Always sum both fields for total
        let total = (parseFloat(first.value) || 0) + (parseFloat(second.value) || 0);
        totalField.value = total.toFixed(2);
        // Paid status visual
        if (first.classList.contains('budui-paid') && second.classList.contains('budui-paid')) {
          totalField.classList.add('budui-paid');
        } else {
          totalField.classList.remove('budui-paid');
        }
      }
    });
    updateBudgetAccordionTotals();
    // Save to Firestore when locking
    if (typeof saveTransportToFirestore === 'function') saveTransportToFirestore();
  } else {
    // Unlock all fields
    editFields.forEach(f => {
      f.removeAttribute('disabled');
    });
    updateBudgetAccordionTotals();
    halfFields.forEach(f => {
      f.removeAttribute('readonly');
    });
    // Totals should always stay readonly
    totalFields.forEach(f => {
      f.setAttribute('readonly', 'readonly');
    });
    lockBtn.dataset.locked = 'false';
    lockIcon.textContent = '🔓';
    lockBtn.title = 'Lock Fields';
    // Show all blocks
    panel.querySelectorAll('.budui-block').forEach(block => {
      block.style.display = '';
      // Update sub-category total on unlock
      const first = block.querySelectorAll('.budui-half')[0];
      const second = block.querySelectorAll('.budui-half')[1];
      const totalField = block.querySelector('.budui-total');
      if (first && second && totalField) {
        // Always sum both fields for total
        let total = (parseFloat(first.value) || 0) + (parseFloat(second.value) || 0);
        totalField.value = total.toFixed(2);
        // Paid status visual
        if (first.classList.contains('budui-paid') && second.classList.contains('budui-paid')) {
          totalField.classList.add('budui-paid');
        } else {
          totalField.classList.remove('budui-paid');
        }
      }
    });
  }
}

// Add click-to-mark-paid for .budui-half inputs in Budget Categories Accordion Sub-categories
document.addEventListener('DOMContentLoaded', function() {
  // Transport
  const transportPanel = document.querySelector('#transportCategoryBtn + .budui-accordion-panel');
  if (transportPanel) {
    const lockBtn = document.getElementById('lock-transport');
    if (lockBtn && lockBtn.dataset.locked !== 'true') {
      toggleLockTransport();
    }
    transportPanel.addEventListener('click', function(e) {
      if (e.target.classList.contains('budui-half')) {
        const lockBtn = document.getElementById('lock-transport');
        if (!lockBtn || lockBtn.dataset.locked !== 'true') return;
        if (e.target.hasAttribute('readonly')) {
          const input = e.target;
          const block = input.closest('.budui-block');
          const totalField = block.querySelector('.budui-total');
          // Toggle paid state
          const wasPaid = input.classList.contains('budui-paid');
          input.classList.toggle('budui-paid');
          const isPaid = input.classList.contains('budui-paid');
          console.log('Paid status changed:', {
            label: block.querySelector('.budui-edit-category-label')?.value,
            input,
            wasPaid,
            isPaid
          });
          // Update total value
          let first = block.querySelectorAll('.budui-half')[0];
          let second = block.querySelectorAll('.budui-half')[1];
          let total = (parseFloat(first.value) || 0) + (parseFloat(second.value) || 0);
          totalField.value = total.toFixed(2);
          // Paid status visual
          if (first.classList.contains('budui-paid') && second.classList.contains('budui-paid')) {
            totalField.classList.add('budui-paid');
          } else {
            totalField.classList.remove('budui-paid');
          }
          // Save immediately after paid status change
          saveTransportToFirestore();
        }
        updateBudgetAccordionTotals();
      }
    });
  }
});


// --- FIREBASE: Transport Save/Load ---
async function saveTransportToFirestore() {
  const user = auth.currentUser;
  if (!user) return;
  const transportPanel = document.querySelector('#transportCategoryBtn')?.nextElementSibling;
  if (!transportPanel) return;
  const blocks = Array.from(transportPanel.querySelectorAll('.budui-block'));
  // Only save up to 10 blocks for Transport
  const categories = blocks.slice(0, 10).map((block, i) => {
    const labelInput = block.querySelector('.budui-edit-category-label');
    const halfFields = block.querySelectorAll('.budui-half');
    const totalField = block.querySelector('.budui-total');
    let label = labelInput ? labelInput.value.trim() : '';
    let first = halfFields[0] ? halfFields[0].value : '';
    let second = halfFields[1] ? halfFields[1].value : '';
    let total = totalField ? totalField.value : '';
    let firstPaid = halfFields[0] ? halfFields[0].classList.contains('budui-paid') : false;
    let secondPaid = halfFields[1] ? halfFields[1].classList.contains('budui-paid') : false;
    // If label is empty or 'Sub-category', treat as default and clear all data
    if (!label || label === 'Sub-category') {
      label = 'Sub-category';
      first = '';
      second = '';
      total = '';
      firstPaid = false;
      secondPaid = false;
    }
    return { label, first, second, total, firstPaid, secondPaid };
  });
  // Save to the currently selected month document
  const docRef = db.collection('users').doc(user.uid).collection('budget').doc(currentMonth);
  const docSnap = await docRef.get();
  const data = docSnap.exists ? docSnap.data() : {};
  data.transport = { categories };
  await docRef.set(data);
}

async function loadTransportFromFirestore() {
  const user = auth.currentUser;
  if (!user) { console.log('No user logged in'); return; }
  // Load from the currently selected month document
  const doc = await db.collection('users').doc(user.uid).collection('budget').doc(currentMonth).get();
  if (!doc.exists || !doc.data().transport) { console.log('No transport data found in default doc'); return; }
  const { categories } = doc.data().transport;
  console.log('Loaded transport categories from unified Firestore:', categories);
  const transportPanel = document.querySelector('#transportCategoryBtn')?.nextElementSibling;
  if (!transportPanel || !categories) { console.log('Transport panel or categories missing'); return; }
  const blocks = Array.from(transportPanel.querySelectorAll('.budui-block'));
  // Only load up to the number of blocks in the UI
  blocks.forEach((block, i) => {
    const cat = categories[i];
    const labelInput = block.querySelector('.budui-edit-category-label');
    const halfFields = block.querySelectorAll('.budui-half');
    const totalField = block.querySelector('.budui-total');
    // Always set label to 'Sub-category' if missing or default
    if (!cat || !cat.label || cat.label === 'Sub-category') {
      if (labelInput) labelInput.value = 'Sub-category';
      if (halfFields[0]) halfFields[0].value = '', halfFields[0].classList.remove('budui-paid');
      if (halfFields[1]) halfFields[1].value = '', halfFields[1].classList.remove('budui-paid');
      if (totalField) totalField.value = '';
      // Always hide if locked
      const isLocked = block.closest('.budui-accordion-panel')?.previousElementSibling?.dataset?.locked === 'true';
      block.style.display = isLocked ? 'none' : '';
      return;
    }
    // Otherwise, load data by index
    if (labelInput) labelInput.value = cat.label;
    if (halfFields[0]) {
      halfFields[0].value = cat.first;
      if (cat.firstPaid) {
        halfFields[0].classList.add('budui-paid');
      } else {
        halfFields[0].classList.remove('budui-paid');
      }
    }
    if (halfFields[1]) {
      halfFields[1].value = cat.second;
      if (cat.secondPaid) {
        halfFields[1].classList.add('budui-paid');
      } else {
        halfFields[1].classList.remove('budui-paid');
      }
    }
    if (totalField) totalField.value = cat.total;
    block.style.display = '';
  });
  // Always lock after loading to hide default/empty blocks
  const lockBtn = document.getElementById('lock-transport');
  if (lockBtn && lockBtn.dataset.locked !== 'true') {
    toggleLockTransport();
  }
  // After locking, always hide all 'Sub-category' blocks
  blocks.forEach(block => {
    const labelInput = block.querySelector('.budui-edit-category-label');
    if (labelInput && labelInput.value.trim().toLowerCase() === 'sub-category') {
      block.style.display = 'none';
    }
  });
  updateBudgetAccordionTotals();
}
//==============================

// Save transport to Firestore when fields change
const transportCategoryBtn = document.querySelector('#transportCategoryBtn');
const transportPanel = transportCategoryBtn ? transportCategoryBtn.nextElementSibling : null;
if (transportPanel) {
  transportPanel.addEventListener('input', function(e) {
    if (
      e.target.classList.contains('budui-half') ||
      e.target.classList.contains('budui-edit-category-label')
    ) {
      saveTransportToFirestore();
    }
  });
  // Also save on blur for label edits (in case user clicks away)
  transportPanel.addEventListener('blur', function(e) {
    if (e.target.classList.contains('budui-edit-category-label')) {
      saveTransportToFirestore();
    }
  }, true);
}
