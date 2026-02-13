// Ensure Income total paid status is updated live on value or paid status change
document.addEventListener('input', function(e) {
  if (e.target.closest('#incomeCategoryBtn + .budui-accordion-panel')) {
    updateIncomeTotalsPaidStatus();
  }
});
// Ensure paid status rule is enforced live across all categories
document.addEventListener('input', function(e) {
  if (e.target.classList.contains('budui-half')) {
    updateAllCategoryTotalsPaidStatus();
  }
});
document.addEventListener('click', function(e) {
  // If a paid toggle or .budui-half is clicked in income, update paid status after a short delay
  const isPaidToggle = e.target.classList.contains('budui-paid-toggle');
  const isHalf = e.target.classList.contains('budui-half');
  const inIncome = (e.target.closest('#incomeCategoryBtn + .budui-accordion-panel') !== null);
  if ((isPaidToggle || isHalf) && inIncome) {
    setTimeout(updateIncomeTotalsPaidStatus, 20);
  }
});
document.addEventListener('click', function(e) {
  // If a paid toggle or .budui-half is clicked in any category, update paid status after a short delay
  const isPaidToggle = e.target.classList.contains('budui-paid-toggle');
  const isHalf = e.target.classList.contains('budui-half');
  if (isPaidToggle || isHalf) {
    setTimeout(updateAllCategoryTotalsPaidStatus, 20);
  }
});

function updateIncomeTotalsPaidStatus() {
  const incomePanel = document.querySelector('#incomeCategoryBtn')?.nextElementSibling;
  if (!incomePanel) return;
  incomePanel.querySelectorAll('.budui-block').forEach(block => {
    const first = block.querySelectorAll('.budui-half')[0];
    const second = block.querySelectorAll('.budui-half')[1];
    const totalField = block.querySelector('.budui-total');
    if (first && second && totalField) {
      const firstFilled = first.value.trim() !== '';
      const secondFilled = second.value.trim() !== '';
      let firstPaid = first.classList.contains('budui-paid');
      let secondPaid = second.classList.contains('budui-paid');
      let paid = false;
      // Rule logic
      if (firstFilled && firstPaid && !secondFilled) {
        paid = true;
        second.classList.add('budui-paid');
        secondPaid = true;
      } else if (!firstFilled && secondFilled && secondPaid) {
        paid = true;
        first.classList.add('budui-paid');
        firstPaid = true;
      } else if (firstFilled && secondFilled && firstPaid && secondPaid) {
        paid = true;
      }
      if (paid) {
        totalField.classList.add('budui-paid');
      } else {
        totalField.classList.remove('budui-paid');
      }
    }
  });
}
function updateAllCategoryTotalsPaidStatus() {
  const allPanels = [
    document.querySelector('#incomeCategoryBtn')?.nextElementSibling,
    document.querySelector('#housingCategoryBtn')?.nextElementSibling,
    document.querySelector('#expensesCategoryBtn')?.nextElementSibling,
    document.querySelector('#transportCategoryBtn')?.nextElementSibling,
    document.querySelector('#multimediaCategoryBtn')?.nextElementSibling,
    document.querySelector('#savingsCategoryBtn')?.nextElementSibling,
    document.querySelector('#othersCategoryBtn')?.nextElementSibling
  ].filter(Boolean);
  allPanels.forEach(panel => {
    panel.querySelectorAll('.budui-block').forEach(block => {
      const first = block.querySelectorAll('.budui-half')[0];
      const second = block.querySelectorAll('.budui-half')[1];
      const totalField = block.querySelector('.budui-total');
      if (first && second && totalField) {
        const firstFilled = first.value.trim() !== '';
        const secondFilled = second.value.trim() !== '';
        let firstPaid = first.classList.contains('budui-paid');
        let secondPaid = second.classList.contains('budui-paid');
        let paid = false;
        // Rule logic
        if (firstFilled && firstPaid && !secondFilled) {
          paid = true;
          second.classList.add('budui-paid');
          secondPaid = true;
        } else if (!firstFilled && secondFilled && secondPaid) {
          paid = true;
          first.classList.add('budui-paid');
          firstPaid = true;
        } else if (firstFilled && secondFilled && firstPaid && secondPaid) {
          paid = true;
        }
        // Unset logic
        if (firstFilled && firstPaid && !secondFilled && !first.classList.contains('budui-paid')) {
          second.classList.remove('budui-paid');
        }
        if (!firstFilled && secondFilled && secondPaid && !second.classList.contains('budui-paid')) {
          first.classList.remove('budui-paid');
        }
        if (firstFilled && firstPaid && !secondFilled && !firstPaid) {
          second.classList.remove('budui-paid');
        }
        if (!firstFilled && secondFilled && secondPaid && !secondPaid) {
          first.classList.remove('budui-paid');
        }
        // If first is set to unpaid, both second and total are unpaid
        if (firstFilled && !firstPaid && !secondFilled) {
          second.classList.remove('budui-paid');
          totalField.classList.remove('budui-paid');
          paid = false;
        }
        // If second is set to unpaid, both first and total are unpaid
        if (!firstFilled && secondFilled && !secondPaid) {
          first.classList.remove('budui-paid');
          totalField.classList.remove('budui-paid');
          paid = false;
        }
        if (paid) {
          totalField.classList.add('budui-paid');
        } else {
          totalField.classList.remove('budui-paid');
        }
      }
    });
  });
}
// Show inline warning/confirmation at bottom of profile accordion, require second click/tap to confirm
let buduiWarnState = { pending: null, confirmed: false };
function showWarningMsg(msg, actionCallback) {
  const warnDiv = document.getElementById('buduiWarningMsg');
  if (!warnDiv) return;
  warnDiv.innerHTML = msg + '<br>';
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Confirm';
  confirmBtn.className = 'budui-action-btn';
  confirmBtn.style.marginTop = '10px';
  confirmBtn.onclick = function(e) {
    e.stopPropagation();
    warnDiv.style.display = 'none';
    warnDiv.innerHTML = '';
    if (typeof actionCallback === 'function') actionCallback();
  };
  warnDiv.appendChild(confirmBtn);
  warnDiv.style.display = 'block';
  warnDiv.style.cursor = 'default';
  warnDiv.onclick = null;
  setTimeout(() => {
    warnDiv.style.display = 'none';
    warnDiv.innerHTML = '';
  }, 10000);
}

// Delete confirmation - "click again to confirm" pattern
let deleteConfirmState = {};
let deleteConfirmTimeout = null;

function setupDeleteConfirm(button, onConfirm) {
  const buttonId = button.id || button.textContent;
  
  if (deleteConfirmState[buttonId]) {
    // Second click - execute delete
    clearTimeout(deleteConfirmTimeout);
    deleteConfirmState[buttonId] = false;
    button.textContent = button.dataset.originalText || 'Delete';
    button.classList.remove('delete-confirm-active');
    onConfirm();
  } else {
    // First click - ask for confirmation
    // Reset any other buttons in confirm state
    Object.keys(deleteConfirmState).forEach(key => {
      deleteConfirmState[key] = false;
    });
    
    deleteConfirmState[buttonId] = true;
    button.dataset.originalText = button.textContent;
    button.textContent = 'Confirm?';
    button.classList.add('delete-confirm-active');
    
    // Reset after 3 seconds
    clearTimeout(deleteConfirmTimeout);
    deleteConfirmTimeout = setTimeout(() => {
      deleteConfirmState[buttonId] = false;
      button.textContent = button.dataset.originalText || 'Delete';
      button.classList.remove('delete-confirm-active');
    }, 3000);
  }
}

// PROFILE ACCORDION BUTTONS LOGIC
document.addEventListener("DOMContentLoaded", function() {
  // Collapse profile accordion on login
  const profilePanel = document.getElementById("profileAccordionPanel");
  if (profilePanel) profilePanel.style.display = "none";
  const resetPaidStatusBtn = document.getElementById("resetPaidStatusBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // Add: Toggle UI for bubble interaction
  if (profilePanel && !document.getElementById('toggleBubbleUiBtn')) {
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggleBubbleUiBtn';
    toggleBtn.className = 'budui-action-btn';
    toggleBtn.textContent = 'Bubble';
    toggleBtn.style.margin = '10px 0 20px 0';
    toggleBtn.style.display = 'block';
    toggleBtn.style.marginLeft = 'auto';
    toggleBtn.style.marginRight = 'auto';
    profilePanel.appendChild(toggleBtn)
    let uiHidden = false;
    let prevMinHeight = null;
    let returnBtn = null;
    toggleBtn.onclick = function() {
      const appView = document.getElementById('appView');
      if (!appView) return;
      Array.from(appView.children).forEach(child => {
        if (child === profilePanel) return;
        if (child.classList && child.classList.contains('bubble-container')) return;
        if (!uiHidden) {
          child.dataset._bubbleUiDisplay = child.style.display;
          child.style.display = 'none';
        } else {
          child.style.display = child.dataset._bubbleUiDisplay || '';
        }
      });
      if (!uiHidden) {
        prevMinHeight = appView.style.minHeight;
        appView.style.minHeight = '625px';
        // Add floating Return button
        if (!returnBtn) {
          returnBtn = document.createElement('button');
          returnBtn.id = 'bubbleReturnBtn';
          returnBtn.textContent = 'Return';
          returnBtn.className = 'budui-action-btn';
          returnBtn.style.position = 'fixed';
          returnBtn.style.left = '50%';
          returnBtn.style.bottom = '52px';
          returnBtn.style.transform = 'translateX(-50%)';
          returnBtn.style.zIndex = '10001';
          returnBtn.style.padding = '8px 24px';
          returnBtn.style.fontSize = '1em';
          returnBtn.style.setProperty('background', 'none', 'important');
          returnBtn.style.setProperty('border', 'none', 'important');
          returnBtn.style.setProperty('outline', 'none', 'important');
          returnBtn.style.setProperty('box-shadow', 'none', 'important');
          returnBtn.style.setProperty('filter', 'none', 'important');
          returnBtn.style.setProperty('backdrop-filter', 'none', 'important');
          returnBtn.style.color = '#e0f4ff99';
          returnBtn.style.borderRadius = '20px';
          returnBtn.style.cursor = 'pointer';
          returnBtn.style.opacity = '0.7';
          returnBtn.style.transition = 'opacity 0.2s';
          returnBtn.onmouseenter = () => { returnBtn.style.opacity = '1'; };
          returnBtn.onmouseleave = () => { returnBtn.style.opacity = '0.7'; };
          returnBtn.onclick = function(e) {
            e.stopPropagation();
            toggleBtn.click(); // Exit bubble mode
          };
        }
        document.body.appendChild(returnBtn);
      } else {
        appView.style.minHeight = prevMinHeight || '';
        if (returnBtn && returnBtn.parentNode) {
          returnBtn.parentNode.removeChild(returnBtn);
        }
      }
      uiHidden = !uiHidden;
      toggleBtn.textContent = uiHidden ? 'Show UI' : 'Bubble';
    };
  }

  if (resetPaidStatusBtn) {
    resetPaidStatusBtn.onclick = function() {
      showWarningMsg(
        "Are you sure you want to reset all paid status?",
        async function() {
          // Remove paid status from all relevant elements
          document.querySelectorAll('.budui-paid').forEach(el => el.classList.remove('budui-paid'));
          if (typeof updateBudgetAccordionTotals === 'function') updateBudgetAccordionTotals();
          // Save all category data to Firestore after reset
          if (typeof saveIncomeToFirestore === 'function') await saveIncomeToFirestore();
          if (typeof saveHousingToFirestore === 'function') await saveHousingToFirestore();
          if (typeof saveTransportToFirestore === 'function') await saveTransportToFirestore();
          if (typeof saveMultiMediaToFirestore === 'function') await saveMultiMediaToFirestore();
          if (typeof saveSavingsToFirestore === 'function') await saveSavingsToFirestore();
          if (typeof saveOthersToFirestore === 'function') await saveOthersToFirestore();
          // Force update of paid status visuals for Income totals
          const incomePanel = document.getElementById('incomeCategoryBtn')?.nextElementSibling;
          if (incomePanel) {
            incomePanel.querySelectorAll('.budui-block').forEach(block => {
              const first = block.querySelectorAll('.budui-half')[0];
              const second = block.querySelectorAll('.budui-half')[1];
              const totalField = block.querySelector('.budui-total');
              if (first && second && totalField) {
                // Re-evaluate paid status for total
                const firstFilled = first.value.trim() !== '';
                const secondFilled = second.value.trim() !== '';
                const firstPaid = first.classList.contains('budui-paid');
                const secondPaid = second.classList.contains('budui-paid');
                let paid = false;
                if ((firstFilled && secondFilled && firstPaid && secondPaid) ||
                    (firstFilled && firstPaid && !secondFilled) ||
                    (secondFilled && secondPaid && !firstFilled)) {
                  paid = true;
                }
                if (paid) {
                  totalField.classList.add('budui-paid');
                } else {
                  totalField.classList.remove('budui-paid');
                }
              }
            });
          }
        }
      );
    };
  }
  if (logoutBtn) {
    logoutBtn.onclick = function() {
      showWarningMsg(
        "Are you sure you want to logout?",
        function() {
          auth.signOut();
        }
      );
    };
  }
});
// ===============================
// SECTION: Accordion & Lock/Unlock Logic
// ===============================
// ===============================LOCK RETURN LOGIC===============================
// Ensure lock returns to locked by default when exiting the sub-category
document.addEventListener('DOMContentLoaded', function() {
  // --- Hue Rotate Filter Controls with localStorage persistence ---
  const hueSlider = document.getElementById('hueRotateSlider');
  const hueValue = document.getElementById('hueRotateValue');
  const resetHueBtn = document.getElementById('resetHueBtn');
  const pipboyTheme = document.querySelector('.pipboy-theme');
  let lastHue = 0;
  function updateHueRotate(val, save = true) {
    lastHue = val;
    hueValue.textContent = val + '°';
    if (pipboyTheme) {
      let baseFilter = 'brightness(1.08) drop-shadow(0 0 8px #4cff6a) blur(0.5px)';
      pipboyTheme.style.filter = baseFilter + ' hue-rotate(' + val + 'deg)';
    }
    if (save) {
      try { localStorage.setItem('budui_hue_rotate', val); } catch (e) {}
    }
  }
  if (hueSlider && hueValue && pipboyTheme) {
    // Restore from localStorage if available
    let savedHue = 0;
    try {
      savedHue = parseInt(localStorage.getItem('budui_hue_rotate') || '0', 10);
      if (isNaN(savedHue)) savedHue = 0;
    } catch (e) { savedHue = 0; }
    hueSlider.value = savedHue;
    updateHueRotate(savedHue, false);
    hueSlider.addEventListener('input', function() {
      updateHueRotate(this.value);
    });
    resetHueBtn.addEventListener('click', function() {
      hueSlider.value = 0;
      updateHueRotate(0);
    });
  }
  const housingBtn = document.getElementById('housingCategoryBtn');
  if (housingBtn) {
    housingBtn.addEventListener('click', function() {
      setTimeout(() => {
        const panel = housingBtn.nextElementSibling;
        if (panel && panel.style.display !== 'block') {
          const lockBtn = document.getElementById('lock-housing');
          if (lockBtn && lockBtn.dataset.locked !== 'true') {
            toggleLockHousing();
          }
        }
      }, 100);
    });
  }

  // Ensure lock returns to locked by default when exiting the Transport sub-category
  const transportBtn = document.getElementById('transportCategoryBtn');
  if (transportBtn) {
    transportBtn.addEventListener('click', function() {
      setTimeout(() => {
        const panel = transportBtn.nextElementSibling;
        if (panel && panel.style.display !== 'block') {
          const lockBtn = document.getElementById('lock-transport');
          if (lockBtn && lockBtn.dataset.locked !== 'true') {
            toggleLockTransport();
          }
        }
      }, 100);
    });
  }

  // Ensure lock returns to locked by default when exiting the Income sub-category
  const incomeBtn = Array.from(document.querySelectorAll('.budui-accordion-btn')).find(btn => btn.textContent.trim() === 'Income');
  if (incomeBtn) {
    incomeBtn.addEventListener('click', function() {
      setTimeout(() => {
        const panel = incomeBtn.nextElementSibling;
        if (panel && panel.style.display !== 'block') {
          const lockBtn = document.getElementById('lock-income');
          if (lockBtn && lockBtn.dataset.locked !== 'true') {
            toggleLockIncome();
          }
        }
      }, 100);
    });
  }

  // Ensure lock returns to locked by default when exiting the Multi-media sub-category
  const multimediaBtn = document.getElementById('multimediaCategoryBtn');
  if (multimediaBtn) {
    multimediaBtn.addEventListener('click', function() {
      setTimeout(() => {
        const panel = multimediaBtn.nextElementSibling;
        if (panel && panel.style.display !== 'block') {
          const lockBtn = document.getElementById('lock-multi-media');
          if (lockBtn && lockBtn.dataset.locked !== 'true') {
            toggleLockMultiMedia();
          }
        }
      }, 100);
    });
  }

  // Ensure lock returns to locked by default when exiting the Savings sub-category
  const savingsBtn = document.getElementById('savingsCategoryBtn');
  if (savingsBtn) {
    savingsBtn.addEventListener('click', function() {
      setTimeout(() => {
        const panel = savingsBtn.nextElementSibling;
        if (panel && panel.style.display !== 'block') {
          const lockBtn = document.getElementById('lock-savings');
          if (lockBtn && lockBtn.dataset.locked !== 'true') {
            toggleLockSavings();
          }
        }
      }, 100);
    });
  }

  // Ensure lock returns to locked by default when exiting the Others sub-category
  const othersBtn = document.getElementById('othersCategoryBtn');
  if (othersBtn) {
    othersBtn.addEventListener('click', function() {
      setTimeout(() => {
        const panel = othersBtn.nextElementSibling;
        if (panel && panel.style.display !== 'block') {
          const lockBtn = document.getElementById('lock-others');
          if (lockBtn && lockBtn.dataset.locked !== 'true') {
            toggleLockOthers();
          }
        }
      }, 100);
    });
  }
});


//===============================UPDATE TOTALS LOGIC=============================
// When locking/unlocking, update all totals in Budget Categories Accordion
function updateBudgetAccordionTotals() {
  // Update all sub-category totals and collect for each main category
  const mainCats = [
    { btn: document.getElementById('incomeCategoryTotalBtn'), panel: document.getElementById('incomeCategoryBtn')?.nextElementSibling },
    { btn: document.getElementById('housingCategoryTotalBtn'), panel: document.getElementById('housingCategoryBtn')?.nextElementSibling },
    { btn: document.getElementById('expensesCategoryTotalBtn'), panel: document.getElementById('expensesCategoryBtn')?.nextElementSibling },
    { btn: document.getElementById('transportCategoryTotalBtn'), panel: document.getElementById('transportCategoryBtn')?.nextElementSibling },
    { btn: document.getElementById('multimediaCategoryTotalBtn'), panel: document.getElementById('multimediaCategoryBtn')?.nextElementSibling },
    { btn: document.getElementById('savingsCategoryTotalBtn'), panel: document.getElementById('savingsCategoryBtn')?.nextElementSibling },
    { btn: document.getElementById('othersCategoryTotalBtn'), panel: document.getElementById('othersCategoryBtn')?.nextElementSibling }
  ];

  mainCats.forEach(cat => {
    if (!cat.btn || !cat.panel) return;
    let catTotal = 0;
    // For Expenses, include all .budui-blocks in the main panel and all sub-panels (multi-media, savings, others)
    let blocks = Array.from(cat.panel.querySelectorAll('.budui-block'));
    if (cat.btn.id === 'expensesCategoryTotalBtn') {
      // Find all .budui-blocks in the main panel and all sibling panels until the next main category
      let next = cat.panel.nextElementSibling;
      while (next && next.classList.contains('budui-accordion-panel')) {
        blocks = blocks.concat(Array.from(next.querySelectorAll('.budui-block')));
        next = next.nextElementSibling;
      }
      // Also include .pip-item.budui-row (for multi-media, savings, others)
      let pipPanels = [];
      let pipNext = cat.panel.nextElementSibling;
      while (pipNext && pipNext.classList.contains('budui-accordion-panel')) {
        pipPanels.push(pipNext);
        pipNext = pipNext.nextElementSibling;
      }
      pipPanels.forEach(panel => {
        blocks = blocks.concat(Array.from(panel.querySelectorAll('.pip-item.budui-row')));
      });
    }
    blocks.forEach(block => {
      // For .budui-block or .pip-item.budui-row
      const first = block.querySelectorAll('.budui-half')[0];
      const second = block.querySelectorAll('.budui-half')[1];
      const totalField = block.querySelector('.budui-total');
      if (first && second && totalField) {
        // Always show forecast (sum of both fields)
        let total = (parseFloat(first.value) || 0) + (parseFloat(second.value) || 0);
        totalField.value = total.toFixed(2);
        // Mark total as paid if:
        // (both values filled and both paid) OR (first filled and paid, second empty) OR (second filled and paid, first empty)
        const firstFilled = first.value.trim() !== '';
        const secondFilled = second.value.trim() !== '';
        const firstPaid = first.classList.contains('budui-paid');
        const secondPaid = second.classList.contains('budui-paid');
        let paid = false;
        if ((firstFilled && secondFilled && firstPaid && secondPaid) ||
            (firstFilled && firstPaid && !secondFilled) ||
            (secondFilled && secondPaid && !firstFilled)) {
          paid = true;
        }
        if (paid) {
          totalField.classList.add('budui-paid');
        } else {
          totalField.classList.remove('budui-paid');
        }
        catTotal += total;
      }
    });
    cat.btn.textContent = `$${catTotal.toFixed(2)}`;
  });
  // Update summary totals
  updateSummaryTotals();
}

// Update the summary bar at the top
function updateSummaryTotals() {
  // --- Income forecast: sum all income sub-cat totals (ignore paid status)
  const spendingPanelTotal = document.getElementById('spendingPanelTotal');
  let incomeForecast = 0;
  let incomeCurrent = 0;
  let expensesForecast = 0;
  let expensesCurrent = 0;
  let remainingForecast = 0;
  let remainingCurrent = 0;

  const incomePanel = document.getElementById('incomeCategoryBtn')?.nextElementSibling;
  if (incomePanel) {
    incomePanel.querySelectorAll('.budui-block').forEach(block => {
      const first = block.querySelectorAll('.budui-half')[0];
      const second = block.querySelectorAll('.budui-half')[1];
      if (first && second) {
        incomeForecast += (parseFloat(first.value) || 0) + (parseFloat(second.value) || 0);
      }
    });
    // --- Income current: sum only paid income sub-cat totals
    incomePanel.querySelectorAll('.budui-block').forEach(block => {
      const first = block.querySelectorAll('.budui-half')[0];
      const second = block.querySelectorAll('.budui-half')[1];
      if (first && second) {
        if (first.classList.contains('budui-paid')) incomeCurrent += parseFloat(first.value) || 0;
        if (second.classList.contains('budui-paid')) incomeCurrent += parseFloat(second.value) || 0;
      }
    });
  }

  // --- Expenses forecast: sum all expense sub-cat totals (ignore paid status) + spending
  const expensesPanel = document.getElementById('expensesCategoryBtn')?.nextElementSibling;
  if (expensesPanel) {
    // Collect all .budui-blocks in the main panel and all sibling panels (multi-media, savings, others)
    let blocks = Array.from(expensesPanel.querySelectorAll('.budui-block'));
    let next = expensesPanel.nextElementSibling;
    while (next && next.classList.contains('budui-accordion-panel')) {
      blocks = blocks.concat(Array.from(next.querySelectorAll('.budui-block')));
      next = next.nextElementSibling;
    }
    // Also include .pip-item.budui-row (for multi-media, savings, others)
    let pipPanels = [];
    let pipNext = expensesPanel.nextElementSibling;
    while (pipNext && pipNext.classList.contains('budui-accordion-panel')) {
      pipPanels.push(pipNext);
      pipNext = pipNext.nextElementSibling;
    }
    pipPanels.forEach(panel => {
      blocks = blocks.concat(Array.from(panel.querySelectorAll('.pip-item.budui-row')));
    });
    blocks.forEach(block => {
      const first = block.querySelectorAll('.budui-half')[0];
      const second = block.querySelectorAll('.budui-half')[1];
      if (first && second) {
        expensesForecast += (parseFloat(first.value) || 0) + (parseFloat(second.value) || 0);
      }
    });
    // --- Expenses current: sum only paid expense sub-cat totals + spending
    expensesPanel.querySelectorAll('.budui-block').forEach(block => {
      const first = block.querySelectorAll('.budui-half')[0];
      const second = block.querySelectorAll('.budui-half')[1];
      if (first && second) {
        if (first.classList.contains('budui-paid')) expensesCurrent += parseFloat(first.value) || 0;
        if (second.classList.contains('budui-paid')) expensesCurrent += parseFloat(second.value) || 0;
      }
    });
  }


  // Add spending ONLY to current (paid) expenses, NOT forecast
  let spendingValue = 0;
  if (spendingPanelTotal) {
    // spendingPanelTotal.textContent is like 'Total: $123.45'
    const match = spendingPanelTotal.textContent.match(/([\d,\.\-]+)$/);
    if (match) {
      spendingValue = parseFloat(match[1].replace(/,/g, '')) || 0;
    }
  }
  expensesCurrent += spendingValue;

  // --- Remaining forecast: income forecast - expenses forecast
  try {
    if (typeof incomeForecast !== 'number' || isNaN(incomeForecast)) throw new Error('incomeForecast is not a number');
    if (typeof expensesForecast !== 'number' || isNaN(expensesForecast)) throw new Error('expensesForecast is not a number');
    remainingForecast = incomeForecast - expensesForecast;
    if (typeof incomeCurrent !== 'number' || isNaN(incomeCurrent)) throw new Error('incomeCurrent is not a number');
    if (typeof expensesCurrent !== 'number' || isNaN(expensesCurrent)) throw new Error('expensesCurrent is not a number');
    remainingCurrent = incomeCurrent - expensesCurrent;
  } catch (e) {
    console.error('[updateSummaryTotals] Calculation error:', e, { incomeForecast, expensesForecast, incomeCurrent, expensesCurrent });
  }

  // Debug: Log remaining forecast and its components
  console.debug('[DEBUG] Remaining Forecast:', {
    incomeForecast,
    expensesForecast,
    remainingForecast,
    incomeCurrent,
    expensesCurrent,
    remainingCurrent,
    spendingValue
  });

  // Update summary bar
  const buduiIncome = document.getElementById('buduiIncome');
  const buduiExpenses = document.getElementById('buduiExpenses');
  const buduiRemainingForecast = document.getElementById('buduiRemainingForecast');
  const buduiRemainingCurrent = document.getElementById('buduiRemainingCurrent');
  const buduiexpensesCurrent = document.getElementById('buduiexpensesCurrent');
  if (!buduiIncome) console.warn('[updateSummaryTotals] buduiIncome element not found');
  if (!buduiExpenses) console.warn('[updateSummaryTotals] buduiExpenses element not found');
  if (!buduiRemainingForecast) console.warn('[updateSummaryTotals] buduiRemainingForecast element not found');
  if (!buduiRemainingCurrent) console.warn('[updateSummaryTotals] buduiRemainingCurrent element not found');
  if (!buduiexpensesCurrent) console.warn('[updateSummaryTotals] buduiexpensesCurrent element not found');
  if (buduiIncome) buduiIncome.textContent = `$${Number(incomeForecast).toFixed(2)}`;
  if (buduiExpenses) buduiExpenses.textContent = `$${Number(expensesForecast).toFixed(2)}`;
  if (buduiRemainingForecast) buduiRemainingForecast.textContent = `$${Number(remainingForecast).toFixed(2)}`;
  if (buduiRemainingCurrent) buduiRemainingCurrent.textContent = `$${Number(remainingCurrent).toFixed(2)}`;
  if (buduiexpensesCurrent) buduiexpensesCurrent.textContent = `$${Number(expensesCurrent).toFixed(2)}`;

  // Update progress bar: Remaining Forecast vs Spending total
  const buduiProgressBar = document.getElementById('buduiProgressBar');
  const buduiProgressSpending = document.getElementById('buduiProgressSpending');
  // spendingValue is already declared above and set
  // Progress bar width: percent of remainingForecast left after spending
  if (buduiProgressBar) {
    let barValue = remainingForecast - spendingValue;
    if (barValue < 0) barValue = 0;
    let percent = 0;
    if (remainingForecast > 0) {
      percent = Math.min(100, (barValue / remainingForecast) * 100);
    }
    buduiProgressBar.style.width = percent + '%';
  }
  // Progress bar number: show remainingForecast - spending
  if (buduiRemainingForecast) {
    let barValue = remainingForecast - spendingValue;
    if (barValue < 0) barValue = 0;
    buduiRemainingForecast.textContent = `$${barValue.toFixed(2)}`;
  }
  if (buduiProgressSpending) buduiProgressSpending.textContent = `$${spendingValue.toFixed(2)}`;
}



// ===============================
// SECTION: Helpers
// ===============================

// Format amounts as currency
function formatAmount(val) {
  let num = parseFloat(val);
  if (isNaN(num)) num = 0;
  return `$${num.toFixed(2)}`;
}



// SECTION: DOM LISTENERS FOR FIREBASE
// ===============================
// On DOM ready, set up listeners for loading/saving income
document.addEventListener("DOMContentLoaded", function() {
  // --- LOGIN LOGIC ---
  const loginBtn = document.getElementById("loginBtn");
  const loginUser = document.getElementById("loginUser");
  const loginEmail = document.getElementById("loginEmail");
  const loginPin = document.getElementById("loginPin");
  const loginError = document.getElementById("loginError");
  if (loginBtn && loginEmail && loginPin && loginError) {
    loginBtn.addEventListener("click", function() {
      const email = (loginEmail.value || "").trim();
      const pin = (loginPin.value || "").trim();
      if (!email || !pin) {
        loginError.textContent = "ENTER EMAIL AND PIN";
        return;
      }
      auth.signInWithEmailAndPassword(email, pin)
        .then(() => {
          loginError.textContent = "";
          if (loginUser) loginUser.value = "";
          loginEmail.value = "";
          loginPin.value = "";
        })
        .catch(err => {
          console.error(err);
          loginError.textContent = `${err.code || "ERROR"}: ${err.message || "LOGIN FAILED"}`;
        });
    });
  }
  // Load income, housing, transport, multi-media, savings, and others from Firestore on login (after DOM is ready)
  auth.onAuthStateChanged(function(user) {
    const incomePanel = document.querySelector('#incomeCategoryBtn')?.nextElementSibling;
    const housingPanel = document.querySelector('#housingCategoryBtn')?.nextElementSibling;
    const transportPanel = document.querySelector('#transportCategoryBtn')?.nextElementSibling;
    const multimediaPanel = document.querySelector('#multimediaCategoryBtn')?.nextElementSibling;
    const savingsPanel = document.querySelector('#savingsCategoryBtn')?.nextElementSibling;
    const othersPanel = document.querySelector('#othersCategoryBtn')?.nextElementSibling;
    let loadsToComplete = 6;
    function onSectionLoaded() {
      loadsToComplete--;
      if (loadsToComplete === 0) {
        // All data loaded, now update all totals and UI
        if (typeof updateBudgetAccordionTotals === 'function') updateBudgetAccordionTotals();
        if (typeof updateSummaryTotals === 'function') updateSummaryTotals();
        // Force update of paid status visuals for all category totals (using new rule)
        const allPanels = [
          document.querySelector('#incomeCategoryBtn')?.nextElementSibling,
          document.querySelector('#housingCategoryBtn')?.nextElementSibling,
          document.querySelector('#expensesCategoryBtn')?.nextElementSibling,
          document.querySelector('#transportCategoryBtn')?.nextElementSibling,
          document.querySelector('#multimediaCategoryBtn')?.nextElementSibling,
          document.querySelector('#savingsCategoryBtn')?.nextElementSibling,
          document.querySelector('#othersCategoryBtn')?.nextElementSibling
        ].filter(Boolean);
        allPanels.forEach(panel => {
          panel.querySelectorAll('.budui-block').forEach(block => {
            const first = block.querySelectorAll('.budui-half')[0];
            const second = block.querySelectorAll('.budui-half')[1];
            const totalField = block.querySelector('.budui-total');
            if (first && second && totalField) {
              const firstFilled = first.value.trim() !== '';
              const secondFilled = second.value.trim() !== '';
              let firstPaid = first.classList.contains('budui-paid');
              let secondPaid = second.classList.contains('budui-paid');
              let paid = false;
              if (firstFilled && firstPaid && !secondFilled) {
                paid = true;
                second.classList.add('budui-paid');
                secondPaid = true;
              } else if (!firstFilled && secondFilled && secondPaid) {
                paid = true;
                first.classList.add('budui-paid');
                firstPaid = true;
              } else if (firstFilled && secondFilled && firstPaid && secondPaid) {
                paid = true;
              }
              if (paid) {
                totalField.classList.add('budui-paid');
              } else {
                totalField.classList.remove('budui-paid');
              }
            }
          });
        });
      }
    }
    if (user && incomePanel) {
      if (typeof loadIncomeFromFirestore === 'function') {
        loadIncomeFromFirestore().then(onSectionLoaded).catch(onSectionLoaded);
      } else { onSectionLoaded(); }
    } else { onSectionLoaded(); }
    if (user && housingPanel) {
      if (typeof loadHousingFromFirestore === 'function') {
        loadHousingFromFirestore().then(onSectionLoaded).catch(onSectionLoaded);
      } else { onSectionLoaded(); }
    } else { onSectionLoaded(); }
    if (user && transportPanel) {
      if (typeof loadTransportFromFirestore === 'function') {
        loadTransportFromFirestore().then(onSectionLoaded).catch(onSectionLoaded);
      } else { onSectionLoaded(); }
    } else { onSectionLoaded(); }
    if (user && multimediaPanel && typeof loadMultiMediaFromFirestore === 'function') {
      loadMultiMediaFromFirestore().then(onSectionLoaded).catch(onSectionLoaded);
    } else { onSectionLoaded(); }
    if (user && savingsPanel && typeof loadSavingsFromFirestore === 'function') {
      loadSavingsFromFirestore().then(onSectionLoaded).catch(onSectionLoaded);
    } else { onSectionLoaded(); }
    if (user && othersPanel && typeof loadOthersFromFirestore === 'function') {
      loadOthersFromFirestore().then(onSectionLoaded).catch(onSectionLoaded);
    } else { onSectionLoaded(); }
  });
// ===============================


  //==============================ACCORDION LOGIC=============================
  // Accordion expand/collapse logic
  document.querySelectorAll('.budui-accordion-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = btn.getAttribute('data-target');
      const panel = document.getElementById(targetId);
      if (!panel) return;
      const isOpen = panel.style.display === 'block';
      // Close all panels
      document.querySelectorAll('.budui-accordion-panel').forEach(p => p.style.display = 'none');
      // Open this one if it was closed
      if (!isOpen) panel.style.display = 'block';
    });
  });


  //==============================BUDGET DASHBOARD RENDERING=============================
  // Persistent login: listen for auth state changes
  auth.onAuthStateChanged(function(user) {
    const appView = document.getElementById("appView");
    const loginView = document.getElementById("loginView");
    if (!appView || !loginView) return;
    if (user) {
      // User is signed in, show dashboard
      loginView.classList.add("hidden");
      appView.classList.remove("hidden");
      // Hide daily quote if present
      var dailyQuote = document.getElementById("dailyQuote");
      if (dailyQuote) dailyQuote.style.display = "none";
      renderBudgetDashboard();
    } else {
      // User is signed out, show login
      appView.classList.add("hidden");
      loginView.classList.remove("hidden");
    }
  });


  //==============================INITIAL CHECK=============================
  // Only run if on Budget UI and user is logged in (appView is visible)
  const appView = document.getElementById("appView");
  const loginView = document.getElementById("loginView");
  if (!appView || !loginView) return;

  // Observe login/appView visibility
  const observer = new MutationObserver(() => {
    if (!appView.classList.contains("hidden") && loginView.classList.contains("hidden")) {
      renderBudgetDashboard();
    }
  });
  observer.observe(appView, { attributes: true, attributeFilter: ["class"] });
  observer.observe(loginView, { attributes: true, attributeFilter: ["class"] });

  // Show the dashboard and attach events
  async function renderBudgetDashboard() {
    // Show dashboard panel and clear dynamic content
    if (document.getElementById("dashboardPanel")) {
      document.getElementById("dashboardPanel").style.display = "block";
    }
    const dashboardContent = document.getElementById("dashboardContent");
    if (dashboardContent) dashboardContent.innerHTML = "";

    // Link login button to dashboard (after successful login)
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
      loginBtn.addEventListener("click", function() {
        setTimeout(() => {
          if (!appView.classList.contains("hidden") && loginView.classList.contains("hidden")) {
            renderBudgetDashboard();
          }
        }, 500); // Wait for login logic to complete
      });
    }
  }


  //==============================SPENDING MODAL LOGIC=============================
  // --- Spending Entries State ---
  let spendingEntries = [];
  // --- Firestore Save/Load for Spending ---
  async function saveSpendingToFirestore() {
    const user = auth.currentUser;
    if (!user) return;
    await db.collection('users').doc(user.uid).collection('budget').doc('spending').set({ entries: spendingEntries });
  }

  async function loadSpendingFromFirestore() {
    const user = auth.currentUser;
    if (!user) return;
    const doc = await db.collection('users').doc(user.uid).collection('budget').doc('spending').get();
    if (!doc.exists) return;
    const { entries } = doc.data();
    if (Array.isArray(entries)) {
      spendingEntries = entries;
      renderSpendingList();
      // Ensure paid status visuals update after spending loads
      if (typeof updateBudgetAccordionTotals === 'function') updateBudgetAccordionTotals();
    }
  }
  let editingSpendingIndex = null;

  // --- Spending Modal Logic ---
  const addSpendingBtn = document.getElementById('addSpendingBtn');
  const spendingList = document.getElementById('spendingList');
  const spendingTotal = document.getElementById('spendingTotal');
  const entryModal = document.getElementById('buduiEntryModal');
  const modalEdit = document.getElementById('modalEntryEdit');
  const modalInfo = document.getElementById('modalEntryInfo');
  const modalEditDesc = document.getElementById('modalEditDesc');
  const modalEditAmt = document.getElementById('modalEditAmt');
  const modalEditConfirmBtn = document.getElementById('modalEditConfirmBtn');
  const closeEntryModal = document.getElementById('closeEntryModal');
  const modalEditBtn = document.getElementById('modalEditBtn');
  const modalDeleteBtn = document.getElementById('modalDeleteBtn');
  const modalEditInitBtn = document.getElementById('modalEditInitBtn');
  const modalEditInitDeleteBtn = document.getElementById('modalEditInitDeleteBtn');
  const modalEditInitCancelBtn = document.getElementById('modalEditInitCancelBtn');

  function openSpendingModal(mode, entryIdx = null) {
    entryModal.style.display = 'flex';
    // Position modal at current viewport scroll position
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    entryModal.style.top = scrollTop + 'px';
    // Prevent body scrolling while modal is open
    document.body.style.overflow = 'hidden';
    const modalEditBtnRow = document.getElementById('modalEditBtnRow');
    const modalEditInitBtnRow = document.getElementById('modalEditInitBtnRow');
    const modalInfoBtnRow = document.getElementById('modalInfoBtnRow');
    if (mode === 'add') {
      modalEdit.style.display = 'flex';
      modalInfo.style.display = 'none';
      modalEditBtnRow.style.display = 'flex';
      if (modalEditInitBtnRow) modalEditInitBtnRow.style.display = 'none';
      if (modalInfoBtnRow) modalInfoBtnRow.style.display = 'none';
      modalEditDesc.value = '';
      modalEditAmt.value = '$';
      editingSpendingIndex = null;
      modalEditConfirmBtn.textContent = 'Add';
    } else if (mode === 'edit' && entryIdx !== null) {
      // Initial edit view: show fields, but with Edit/Delete/Cancel
      modalEdit.style.display = 'flex';
      modalInfo.style.display = 'none';
      if (modalEditBtnRow) modalEditBtnRow.style.display = 'none';
      if (modalEditInitBtnRow) modalEditInitBtnRow.style.display = 'flex';
      if (modalInfoBtnRow) modalInfoBtnRow.style.display = 'none';
      const entry = spendingEntries[entryIdx];
      modalEditDesc.value = entry.desc;
      modalEditAmt.value = '$' + entry.amt;
      editingSpendingIndex = entryIdx;
    } else if (mode === 'info' && entryIdx !== null) {
      modalEdit.style.display = 'none';
      modalInfo.style.display = 'block';
      if (modalEditBtnRow) modalEditBtnRow.style.display = 'none';
      if (modalEditInitBtnRow) modalEditInitBtnRow.style.display = 'none';
      if (modalInfoBtnRow) modalInfoBtnRow.style.display = 'flex';
      const entry = spendingEntries[entryIdx];
      document.getElementById('modalEntryDesc').textContent = entry.desc;
      document.getElementById('modalEntryAmount').textContent = formatAmount(entry.amt);
      editingSpendingIndex = entryIdx;
    }
  }

  function closeSpendingModal() {
    entryModal.style.display = 'none';
    editingSpendingIndex = null;
    // Restore body scrolling
    document.body.style.overflow = '';
  }

  // Close modal when clicking outside the modal content
  if (entryModal) {
    entryModal.addEventListener('click', function(e) {
      if (e.target === entryModal) {
        closeSpendingModal();
      }
    });
  }

  function renderSpendingList() {
    if (!spendingEntries.length) {
      spendingList.textContent = 'No spending entries yet.';
    } else {
      spendingList.innerHTML = '';
      
      // Count occurrences of each description to find most frequent
      const descCounts = {};
      spendingEntries.forEach(entry => {
        const desc = (entry.desc || '').toLowerCase().trim();
        descCounts[desc] = (descCounts[desc] || 0) + 1;
      });
      
      // Find the most frequently repeated description (must appear more than once)
      let mostFrequentDesc = null;
      let maxCount = 1; // Only highlight if appears more than once
      for (const [desc, count] of Object.entries(descCounts)) {
        if (count > maxCount) {
          maxCount = count;
          mostFrequentDesc = desc;
        }
      }
      
      spendingEntries.forEach((entry, idx) => {
        const div = document.createElement('div');
        div.className = 'budui-list-entry';
        
        // Apply glow to most frequently repeated entry
        const entryDesc = (entry.desc || '').toLowerCase().trim();
        if (mostFrequentDesc && entryDesc === mostFrequentDesc) {
          div.classList.add('recurring-entry');
        }
        
        div.style.cursor = 'pointer';
        div.onclick = () => openSpendingModal('edit', idx);
        // Description left, amount right
        const descSpan = document.createElement('span');
        descSpan.textContent = entry.desc;
        const amtSpan = document.createElement('span');
        amtSpan.className = 'budui-list-amount';
        amtSpan.textContent = formatAmount(entry.amt);
        div.appendChild(descSpan);
        div.appendChild(amtSpan);
        spendingList.appendChild(div);
      });
    }
    // Update total
    const total = spendingEntries.reduce((sum, e) => sum + parseFloat(e.amt || 0), 0);
    const spendingPanelTotal = document.getElementById('spendingPanelTotal');
    if (spendingPanelTotal) spendingPanelTotal.textContent = `Total: ${formatAmount(total)}`;
    const catBtn = document.getElementById('spendingCategoryTotalBtn');
    if (catBtn) catBtn.textContent = formatAmount(total);
    const progSpend = document.getElementById('buduiProgressSpending');
    if (progSpend) progSpend.textContent = formatAmount(total);
    // Save to Firestore on every change
    saveSpendingToFirestore();
    // Force update of summary bar and current expenses after spending is rendered
    if (typeof updateSummaryTotals === 'function') updateSummaryTotals();
    // Ensure paid status visuals update (totals, etc)
    if (typeof updateBudgetAccordionTotals === 'function') updateBudgetAccordionTotals();
  }
// Accordion open/close: add .open class to main-cat when open
document.querySelectorAll('.budui-accordion-btn.main-cat').forEach(btn => {
  btn.addEventListener('click', function() {
    const panel = btn.nextElementSibling;
    if (!panel) return;
    setTimeout(() => {
      if (panel.style.display === 'block') {
        btn.classList.add('open');
      } else {
        btn.classList.remove('open');
      }
    }, 10);
  });
});

  if (addSpendingBtn) {
    addSpendingBtn.onclick = () => openSpendingModal('add');
  }
  if (closeEntryModal) {
    closeEntryModal.onclick = closeSpendingModal;
  }
  if (modalEditInitCancelBtn) {
    modalEditInitCancelBtn.onclick = closeSpendingModal;
  }
  if (modalEditInitBtn) {
    modalEditInitBtn.onclick = function() {
      // Save the entry directly
      const desc = modalEditDesc.value.trim();
      const amt = parseFloat(modalEditAmt.value.replace(/[$,]/g, ''));
      if (!desc || isNaN(amt)) {
        showWarningMsg('Please enter a description and amount.');
        return;
      }
      if (editingSpendingIndex !== null) {
        spendingEntries[editingSpendingIndex] = { desc, amt };
      }
      renderSpendingList();
      updateBudgetAccordionTotals();
      closeSpendingModal();
    };
  }
  if (modalEditInitDeleteBtn) {
    modalEditInitDeleteBtn.onclick = function() {
      if (editingSpendingIndex !== null) {
        setupDeleteConfirm(modalEditInitDeleteBtn, function() {
          spendingEntries.splice(editingSpendingIndex, 1);
          renderSpendingList();
          closeSpendingModal();
        });
      }
    };
  }
  // Load spending from Firestore on login
  auth.onAuthStateChanged(function(user) {
    if (user) {
      loadSpendingFromFirestore();
    } else {
      spendingEntries = [];
      renderSpendingList();
    }
  });
  if (modalEditConfirmBtn) {
    modalEditConfirmBtn.onclick = function() {
      const desc = modalEditDesc.value.trim();
      const amt = parseFloat(modalEditAmt.value.replace(/[$,]/g, ''));
      if (!desc || isNaN(amt)) {
        showWarningMsg('Please enter a description and amount.');
        return;
      }
      if (editingSpendingIndex === null) {
        // Add new
        spendingEntries.push({ desc, amt });
      } else {
        // Edit existing
        spendingEntries[editingSpendingIndex] = { desc, amt };
      }
      renderSpendingList();
      updateBudgetAccordionTotals();
      closeSpendingModal();
    };
  }
  if (modalEditBtn) {
    modalEditBtn.onclick = function() {
      if (editingSpendingIndex !== null) {
        // Switch to edit mode
        const modalEditBtnRow = document.getElementById('modalEditBtnRow');
        const modalInfoBtnRow = document.getElementById('modalInfoBtnRow');
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
          renderSpendingList();
          closeSpendingModal();
        });
      }
    };
  }

  // Initial render
  renderSpendingList();

});


// ========== BOUNCING BUBBLES EFFECT ==========
(function() {
  const BUBBLE_COUNT = 15;
  const MIN_SIZE = 30;
  const MAX_SIZE = 120;
  const MIN_SPEED = 0.7;
  const MAX_SPEED = 10.0; // Even lower top speed
  const SLOW_FACTOR = 0.7; // More momentum
  const DISTURB_FORCE = 0; // Disruption disabled
  const FRICTION =  0.99; // Even higher resistance (slows down faster)
  const MIN_VELOCITY = 0.28; // Minimum speed for any bubble
  const MIN_MOMENTUM = 0.22; // Minimum momentum (speed * mass)
  const BUBBLE_PUSH = 0; // Disruption disabled

  let bubbles = [];
  let container = null;
  let animationId = null;

  function createBubbles() {
    const terminal = document.getElementById('terminal');
    if (!terminal) return;
    
    container = document.createElement('div');
    container.className = 'bubble-container';
    terminal.insertBefore(container, terminal.firstChild);

    // Get container dimensions after inserting
    const rect = container.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const size = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.style.width = size + 'px';
      bubble.style.height = size + 'px';
      
      const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
      const angle = Math.random() * Math.PI * 2;
      
      bubbles.push({
        el: bubble,
        x: Math.random() * (w - size),
        y: Math.random() * (h - size),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size
      });
      
      container.appendChild(bubble);
    }
  }

  function disturbBubbles(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
      // Change direction only, keep speed, add small push
      bubbles.forEach(b => {
        const angle = Math.random() * Math.PI * 2;
        let speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        speed += BUBBLE_PUSH;
        b.vx = Math.cos(angle) * speed;
        b.vy = Math.sin(angle) * speed;
      });
    } else {
      // Change direction away from (x, y), keep speed, add small push
      bubbles.forEach(b => {
        const cx = b.x + b.size/2;
        const cy = b.y + b.size/2;
        const dx = cx - x;
        const dy = cy - y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        let speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        speed += BUBBLE_PUSH;
        b.vx = (dx/dist) * speed;
        b.vy = (dy/dist) * speed;
      });
    }
  }

  function handleBubbleCollisions() {
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i];
        const b = bubbles[j];
        const dx = (a.x + a.size/2) - (b.x + b.size/2);
        const dy = (a.y + a.size/2) - (b.y + b.size/2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        const minDist = (a.size + b.size) / 2;
        if (dist < minDist && dist > 0) {
          // Simple elastic collision
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          // Push them apart
          a.x += nx * overlap/2;
          a.y += ny * overlap/2;
          b.x -= nx * overlap/2;
          b.y -= ny * overlap/2;
          // Exchange velocity
          const dvx = a.vx - b.vx;
          const dvy = a.vy - b.vy;
          const dot = dvx * nx + dvy * ny;
          if (dot < 0) {
            a.vx -= dot * nx;
            a.vy -= dot * ny;
            b.vx += dot * nx;
            b.vy += dot * ny;
          }
        }
      }
    }
  }

  function keepBubblesMoving() {
    bubbles.forEach(b => {
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (speed < MIN_MOMENTUM) {
        // Preserve direction, boost velocity to minimum momentum
        const angle = Math.atan2(b.vy, b.vx);
        b.vx = Math.cos(angle) * MIN_MOMENTUM;
        b.vy = Math.sin(angle) * MIN_MOMENTUM;
      }
    });
  }

  function animateBubbles() {
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    handleBubbleCollisions();
    keepBubblesMoving();
    bubbles.forEach(b => {
      b.x += b.vx * SLOW_FACTOR;
      b.y += b.vy * SLOW_FACTOR;
      b.vx *= FRICTION;
      b.vy *= FRICTION;
      // Bounce off walls
      if (b.x <= 0) {
        b.x = 0;
        b.vx = Math.abs(b.vx);
      } else if (b.x + b.size >= w) {
        b.x = w - b.size;
        b.vx = -Math.abs(b.vx);
      }
      if (b.y <= 0) {
        b.y = 0;
        b.vy = Math.abs(b.vy);
      } else if (b.y + b.size >= h) {
        b.y = h - b.size;
        b.vy = -Math.abs(b.vy);
      }
      b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
    });
    animationId = requestAnimationFrame(animateBubbles);
  }
  
  function init() {
        // Touchend event: impart momentum on release
        window.addEventListener('touchend', function(e) {
          if (!lastTouch) return;
          // Use the last known movement direction and speed
          // If touchend has changed position, use that
          let x = lastTouch.x, y = lastTouch.y;
          if (e.changedTouches && e.changedTouches.length) {
            x = e.changedTouches[0].clientX;
            y = e.changedTouches[0].clientY;
          }
          const dx = x - lastTouch.x;
          const dy = y - lastTouch.y;
          const dt = Math.max(1, Date.now() - lastTouch.t);
          const mag = Math.sqrt(dx*dx + dy*dy);
          if (mag < 2) return; // Ignore tiny moves
          const angle = Math.atan2(dy, dx);
          const force = Math.min(4, mag * 0.08 * (12 / dt)); // Much slower, similar to tap disruption
          bubbles.forEach(b => {
            const massFactor = 0.7 + 0.3 * (b.size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE); // Range: 0.7-1.0
            b.vx += Math.cos(angle) * force / massFactor;
            b.vy += Math.sin(angle) * force / massFactor;
          });
          skipNextTapDisturb = true;
          lastTouch = null;
        }, { passive: true });
    if (!document.body.classList.contains('pipboy-theme')) return;
    createBubbles();
    animateBubbles();
    
    // User actions disturb bubbles
    let skipNextTapDisturb = false;
    let lastTouch = null;
    const disturbHandler = e => {
      if (skipNextTapDisturb) {
        skipNextTapDisturb = false;
        return;
      }
      let x, y;
      if (e.touches && e.touches.length) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
        x = e.clientX;
        y = e.clientY;
      }
      disturbBubbles(x, y);
    };
    /*
    window.addEventListener('mousedown', disturbHandler);
    window.addEventListener('touchstart', function(e) {
      lastTouch = e.touches && e.touches.length ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() } : null;
      disturbHandler(e);
    });
    window.addEventListener('keydown', () => disturbBubbles());

    // Touchmove event: give directional momentum to bubbles and override tap disruption
    window.addEventListener('touchmove', function(e) {
      // Swiping effect with inverted direction
      if (!lastTouch || !e.touches || !e.touches.length) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = x - lastTouch.x;
      const dy = y - lastTouch.y;
      const mag = Math.sqrt(dx*dx + dy*dy);
      if (mag < 2) return; // Ignore tiny moves
      // Invert the direction
      const angle = Math.atan2(-dy, -dx);
      bubbles.forEach(b => {
        let speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        b.vx = Math.cos(angle) * speed;
        b.vy = Math.sin(angle) * speed;
      });
      skipNextTapDisturb = true;
      lastTouch = { x, y, t: Date.now() };
    }, { passive: true });

    // Scroll event: give directional momentum to bubbles and override tap disruption
    window.addEventListener('wheel', function(e) {
      const mag = Math.sqrt(e.deltaX * e.deltaX + e.deltaY * e.deltaY);
      if (mag === 0) return;
      const angle = Math.atan2(e.deltaY, e.deltaX);
      // Change direction only, keep speed, add small push
      bubbles.forEach(b => {
        let speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        speed += BUBBLE_PUSH;
        b.vx = Math.cos(angle) * speed;
        b.vy = Math.sin(angle) * speed;
      });
      skipNextTapDisturb = true;
    }, { passive: true });
    */
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
