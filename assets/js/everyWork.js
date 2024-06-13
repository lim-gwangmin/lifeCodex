const MODAL_BG = 'modal_bg';
const ACTIVE = 'active';
const OVERFLOW = 'overflow';
const INPUT = 'INPUT';
const bodyElem = document.querySelector('body');
const modalBackgroundElem = document.querySelector('.modal_bg');
const modalCloseBtn = document.querySelector('.modal_close');
const checkboxElem = document.querySelector('.duty_wrapper .check_list');
const $sticker_btns = $('.sticker_btn');
const $stickers = $('.sticker_btn + .sticker');
let checkboxData = { id: null };

$('html').on('click', function(e) {
   const isStickerActive = $sticker_btns.hasClass(ACTIVE);

   if(isStickerActive) {
      $sticker_btns.removeClass(ACTIVE);
      bodyElem.classList.remove(OVERFLOW);
   }
});
function handleCloseModal() {
   const target = $(this).attr('data-modal');

   $(`.${target}`).removeClass(ACTIVE);
   modalBackgroundElem.classList.remove(ACTIVE);
   bodyElem.classList.remove(OVERFLOW);
};

// const targetCheckbox = function(event) {
//    const { target } = event;
//    const { tagName } = target;

//    if(tagName !== INPUT) return;

//    const id = target.getAttribute('value');
//    const checked = target.checked;

//    checkboxData = { id };
//    bodyElem.classList.add(OVERFLOW);
//    modalBackgroundElem.classList.add(ACTIVE);

//    event.preventDefault();
// };
   // header btn
   function toggleClass(e) {
      const $this = $(this);
      const hasClass = $(this).hasClass(ACTIVE);

      $sticker_btns.removeClass(ACTIVE);

      if(hasClass) {
         $this.removeClass(ACTIVE);
         bodyElem.classList.remove(OVERFLOW);
      } else {
         $this.addClass(ACTIVE);
         bodyElem.classList.add(OVERFLOW);
      };

      e.stopPropagation();

   };
const handletoggleCheckBox = ({ data }) => {
   const { id, checked } = data;
   const targetInputElem = document.getElementById(`work_${id}`);

   targetInputElem.checked = checked;

   modalBackgroundElem.classList.remove(ACTIVE);
   bodyElem.classList.remove(OVERFLOW);
}; 

const everyWorksCheck = async function() {

   try {
      await fetch(`/api/checked/${checkboxData.id}`, {
         method: 'PUT',
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify(checkboxData),
      })
      .then( res => res.json())
      .then( res => {
         const { message, result } = res;

         if(result) {
            handletoggleCheckBox(res);
            alert(message);
         } else {
            alert('오류가 있습니다. 다시 시도해주세요.');
         };

      })
      .catch( err => {
         console.log(err, 'err')
      })

   } catch ( err ) {
      console.log(err)
   }

};
modalCloseBtn.addEventListener('click', handleCloseModal);
$sticker_btns.on('click', toggleClass);
$stickers.on('click', function(e) { e.stopPropagation(); });