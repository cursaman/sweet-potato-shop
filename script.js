const productSelect = document.querySelector('#productSelect');
const quantitySelect = document.querySelector('#quantitySelect');
const noteInput = document.querySelector('#noteInput');
const orderSummary = document.querySelector('#orderSummary');
const copyButton = document.querySelector('#copyButton');
const copyStatus = document.querySelector('#copyStatus');

function updateSummary() {
  const note = noteInput.value.trim();
  orderSummary.textContent = `안녕하세요. ${productSelect.value} 고구마 ${quantitySelect.value} 주문 가능 여부와 금액이 궁금합니다.${note ? ` 추가 요청: ${note}` : ''}`;
}

[productSelect, quantitySelect, noteInput].forEach((field) => field.addEventListener('input', updateSummary));

document.querySelectorAll('[data-product]').forEach((button) => {
  button.addEventListener('click', () => {
    productSelect.value = button.dataset.product;
    updateSummary();
    document.querySelector('#order').scrollIntoView({ behavior: 'smooth' });
  });
});

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(orderSummary.textContent);
    copyButton.textContent = '복사했어요';
    copyStatus.textContent = '문의 내용이 복사되었습니다. 문자나 메신저에 붙여넣어 보내세요.';
    setTimeout(() => { copyButton.textContent = '문의 내용 복사하기'; }, 1800);
  } catch {
    copyStatus.textContent = '복사할 수 없습니다. 미리보기 문장을 직접 선택해 복사해 주세요.';
  }
});
