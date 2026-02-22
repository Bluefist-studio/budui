// Spending category logic (modular, month-dependent)

let spendingEntries = [];
let spendingReady = false;
let editingSpendingIndex = null;

// Always use currentMonth from global scope
async function saveSpendingToFirestore() {
  const user = auth.currentUser;
  if (!user) return;
  await db.collection('users').doc(user.uid).collection('budget').doc(currentMonth).set({
    ...((await db.collection('users').doc(user.uid).collection('budget').doc(currentMonth).get()).data() || {}),
    spending: { entries: spendingEntries }
  });
  if (typeof updateSummaryTotals === 'function') updateSummaryTotals();
}

async function loadSpendingFromFirestore() {
  spendingReady = false;
  const user = auth.currentUser;
  if (!user) { spendingReady = true; return; }
  const doc = await db.collection('users').doc(user.uid).collection('budget').doc(currentMonth).get();
  if (!doc.exists || !doc.data().spending) { spendingEntries = []; spendingReady = true; renderSpendingList(); return; }
  const { entries } = doc.data().spending;
  spendingEntries = Array.isArray(entries) ? entries : [];
  renderSpendingList();
  if (typeof updateBudgetAccordionTotals === 'function') updateBudgetAccordionTotals();
  spendingReady = true;
}

function renderSpendingList() {
  const spendingList = document.getElementById('spendingList');
  const spendingPanelTotal = document.getElementById('spendingPanelTotal');
  if (!spendingEntries.length) {
    spendingList.textContent = 'No spending entries yet.';
    if (spendingPanelTotal) spendingPanelTotal.textContent = 'Total: $0.00';
  } else {
    spendingList.innerHTML = '';
    let total = 0;
    spendingEntries.forEach((entry, idx) => {
      const div = document.createElement('div');
      div.className = 'budui-list-entry';
      div.style.cursor = 'pointer';
      div.onclick = () => openSpendingModal('edit', idx);
      const descSpan = document.createElement('span');
      descSpan.textContent = entry.desc;
      const amtSpan = document.createElement('span');
      amtSpan.className = 'budui-list-amount';
      amtSpan.textContent = formatAmount(entry.amt);
      div.appendChild(descSpan);
      div.appendChild(amtSpan);
      spendingList.appendChild(div);
      total += parseFloat(entry.amt) || 0;
    });
    if (spendingPanelTotal) spendingPanelTotal.textContent = 'Total: $' + total.toFixed(2);
  }
}

function openSpendingModal(mode, entryIdx = null) {
  const entryModal = document.getElementById('buduiEntryModal');
  const modalEdit = document.getElementById('modalEntryEdit');
  const modalInfo = document.getElementById('modalEntryInfo');
  const modalEditDesc = document.getElementById('modalEditDesc');
  const modalEditAmt = document.getElementById('modalEditAmt');
  const modalEditConfirmBtn = document.getElementById('modalEditConfirmBtn');
  const modalEditBtnRow = document.getElementById('modalEditBtnRow');
  const modalEditInitBtnRow = document.getElementById('modalEditInitBtnRow');
  const modalInfoBtnRow = document.getElementById('modalInfoBtnRow');
  if (!entryModal || !modalEdit || !modalInfo || !modalEditDesc || !modalEditAmt || !modalEditConfirmBtn) {
    alert('Spending modal not found.'); return;
  }
  entryModal.style.display = 'flex';
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  entryModal.style.top = scrollTop + 'px';
  document.body.style.overflow = 'hidden';
  modalEdit.style.display = 'none';
  modalInfo.style.display = 'none';
  if (modalEditBtnRow) modalEditBtnRow.style.display = 'none';
  if (modalEditInitBtnRow) modalEditInitBtnRow.style.display = 'none';
  if (modalInfoBtnRow) modalInfoBtnRow.style.display = 'none';

  if (mode === 'add') {
    modalEdit.style.display = 'flex';
    modalEditBtnRow.style.display = 'flex';
    modalEditDesc.value = '';
    modalEditAmt.value = '$';
    editingSpendingIndex = null;
    modalEditConfirmBtn.textContent = 'Add';
  } else if (mode === 'edit' && entryIdx !== null) {
    modalEdit.style.display = 'flex';
    modalEditInitBtnRow.style.display = 'flex';
    const entry = spendingEntries[entryIdx];
    modalEditDesc.value = entry.desc;
    modalEditAmt.value = '$' + entry.amt;
    editingSpendingIndex = entryIdx;
    modalEditConfirmBtn.textContent = 'Save';
  } else if (mode === 'info' && entryIdx !== null) {
    modalInfo.style.display = 'block';
    modalInfoBtnRow.style.display = 'flex';
    const entry = spendingEntries[entryIdx];
    document.getElementById('modalEntryDesc').textContent = entry.desc;
    document.getElementById('modalEntryAmount').textContent = formatAmount(entry.amt);
    editingSpendingIndex = entryIdx;
  }
}

function closeSpendingModal() {
  const entryModal = document.getElementById('buduiEntryModal');
  if (entryModal) entryModal.style.display = 'none';
  editingSpendingIndex = null;
  document.body.style.overflow = '';
}

// Attach event handlers (to be called from main script)
function attachSpendingHandlers() {
  const addSpendingBtn = document.getElementById('addSpendingBtn');
  const closeEntryModal = document.getElementById('closeEntryModal');
  const modalEditInitCancelBtn = document.getElementById('modalEditInitCancelBtn');
  const modalEditInitBtn = document.getElementById('modalEditInitBtn');
  const modalEditInitDeleteBtn = document.getElementById('modalEditInitDeleteBtn');
  const modalEditConfirmBtn = document.getElementById('modalEditConfirmBtn');
  const modalEditBtn = document.getElementById('modalEditBtn');
  const modalDeleteBtn = document.getElementById('modalDeleteBtn');

  if (addSpendingBtn) {
    addSpendingBtn.onclick = () => {
      if (!spendingReady) {
        showWarningMsg('Please wait, loading latest spending data...');
        return;
      }
      openSpendingModal('add');
    };
  }
  if (closeEntryModal) closeEntryModal.onclick = closeSpendingModal;
  if (modalEditInitCancelBtn) modalEditInitCancelBtn.onclick = closeSpendingModal;
  if (modalEditInitBtn) {
    modalEditInitBtn.onclick = function() {
      const desc = modalEditDesc.value.trim();
      const amt = parseFloat(modalEditAmt.value.replace(/[$,]/g, ''));
      if (!desc || isNaN(amt)) {
        showWarningMsg('Please enter a description and amount.');
        return;
      }
      if (editingSpendingIndex !== null) {
        spendingEntries[editingSpendingIndex] = { desc, amt };
      }
      saveSpendingToFirestore();
      renderSpendingList();
      if (typeof updateSummaryTotals === 'function') updateSummaryTotals();
      closeSpendingModal();
    };
  }
  if (modalEditInitDeleteBtn) {
    modalEditInitDeleteBtn.onclick = function() {
      if (editingSpendingIndex !== null) {
        setupDeleteConfirm(modalEditInitDeleteBtn, function() {
          spendingEntries.splice(editingSpendingIndex, 1);
          saveSpendingToFirestore();
          renderSpendingList();
          if (typeof updateSummaryTotals === 'function') updateSummaryTotals();
          closeSpendingModal();
        });
      }
    };
  }
  if (modalEditConfirmBtn) {
    modalEditConfirmBtn.onclick = function() {
      const desc = modalEditDesc.value.trim();
      const amt = parseFloat(modalEditAmt.value.replace(/[$,]/g, ''));
      if (!desc || isNaN(amt)) {
        showWarningMsg('Please enter a description and amount.');
        return;
      }
      if (editingSpendingIndex === null) {
        spendingEntries.push({ desc, amt });
      } else {
        spendingEntries[editingSpendingIndex] = { desc, amt };
      }
      saveSpendingToFirestore();
      renderSpendingList();
      if (typeof updateSummaryTotals === 'function') updateSummaryTotals();
      closeSpendingModal();
    };
  }
  if (modalEditBtn) {
    modalEditBtn.onclick = function() {
      if (editingSpendingIndex !== null) {
        const modalEditBtnRow = document.getElementById('modalEditBtnRow');
        const modalInfoBtnRow = document.getElementById('modalInfoBtnRow');
        const modalEdit = document.getElementById('modalEntryEdit');
        const modalInfo = document.getElementById('modalEntryInfo');
        const modalEditDesc = document.getElementById('modalEditDesc');
        const modalEditAmt = document.getElementById('modalEditAmt');
        const modalEditConfirmBtn = document.getElementById('modalEditConfirmBtn');
        modalEdit.style.display = 'flex';
        modalInfo.style.display = 'none';
        if (modalEditBtnRow) modalEditBtnRow.style.display = 'flex';
        if (modalInfoBtnRow) modalInfoBtnRow.style.display = 'none';
        const entry = spendingEntries[editingSpendingIndex];
        modalEditDesc.value = entry.desc;
        modalEditAmt.value = '$' + entry.amt;
        modalEditConfirmBtn.textContent = 'Save';
      }
    };
  }
  if (modalDeleteBtn) {
    modalDeleteBtn.onclick = function() {
      if (editingSpendingIndex !== null) {
        setupDeleteConfirm(modalDeleteBtn, function() {
          spendingEntries.splice(editingSpendingIndex, 1);
          saveSpendingToFirestore();
          renderSpendingList();
          if (typeof updateSummaryTotals === 'function') updateSummaryTotals();
          closeSpendingModal();
        });
      }
    };
  }
}

// Export functions for use in main script
window.spending = {
  loadSpendingFromFirestore,
  saveSpendingToFirestore,
  renderSpendingList,
  openSpendingModal,
  closeSpendingModal,
  attachSpendingHandlers
};
