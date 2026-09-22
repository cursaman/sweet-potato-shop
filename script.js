const productSelect = document.querySelector('#productSelect');
const packageSelect = document.querySelector('#packageSelect');
const quantitySelect = document.querySelector('#quantitySelect');
const noteInput = document.querySelector('#noteInput');
const orderSummary = document.querySelector('#orderSummary');
const copyButton = document.querySelector('#copyButton');
const copyStatus = document.querySelector('#copyStatus');

function updateSummary() {
  const note = noteInput.value.trim();
  const boxes = Number(quantitySelect.value);
  const unitPrice = Number(packageSelect.selectedOptions[0].dataset.total);
  const quantityLabel = boxes === 4 ? '4상자 이상' : `${boxes}상자`;
  const priceText = boxes === 4 ? '수량에 따른 최종 금액을 안내해 주세요.' : `판매가 기준 예상 결제금액은 ${(unitPrice * boxes).toLocaleString('ko-KR')}원으로 확인했습니다.`;
  orderSummary.textContent = `안녕하세요. ${productSelect.value} 고구마 ${packageSelect.value} ${quantityLabel} 주문 가능 여부가 궁금합니다. ${priceText}${note ? ` 추가 요청: ${note}` : ''}`;
}

[productSelect, packageSelect, quantitySelect, noteInput].forEach((field) => field.addEventListener('input', updateSummary));

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
