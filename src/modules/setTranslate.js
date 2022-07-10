const img = [].slice.call(document.querySelectorAll('#goog-gt-tt img,#google_translate_element img'));
img.forEach(function (v, i) {
  v.src = '';
});

const recoverPage = document.createElement('div')
recoverPage.setAttribute('class', 'notranslate recoverPage')
recoverPage.style.cssText = `
width: 45px;
background-color: #f0f8ff;
position: fixed;
left: -5px;
z-index: 10000000;
bottom: 50px;
user-select: none;
text-align: center;
border: 1px solid #a8a8a8;
font-size: small;
line-height: 25px;
border-radius: 15px;
box-shadow: 1px 1px 3px 0 #c0c0c0;
opacity: 0.4;
transform: translateX(-70%);
transition: all 0.3s;
`
recoverPage.innerText = '原文'
document.body.appendChild(recoverPage)
recoverPage.onclick = (() => {
  const phoneRecoverIframe = document.getElementById(':1.container')
  const PCRecoverIframe = document.getElementById(':2.container')
  if (phoneRecoverIframe) {
    const recoverDocument = phoneRecoverIframe.contentWindow.document
    recoverDocument.getElementById(':1.restore').click()
  } else if (PCRecoverIframe) {
    const recoverDocument = PCRecoverIframe.contentWindow.document
    recoverDocument.getElementById(':2.restore').click()
  }
})
// 翻译按钮设置
const google_translate_element = document.createElement('div')
google_translate_element.id = 'google_translate_element';
google_translate_element.style.cssText = `
position: fixed;
width: 80px;
left: 0px;
bottom: 25px;
height: 22px;
border: 2px solid #0000;
border-radius: 5px;
z-index: 10000000;
overflow: hidden;
box-shadow: 1px 1px 3px 0 #0000;
opacity: 0.4;
transform: translateX(-75%);
transition: all 0.3s;
`
document.body.appendChild(google_translate_element);

const gtehtml =
  function googleTranslateElementInit() {
    new google.translate.TranslateElement({
      autoDisplay: true,
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      multilanguagePage: true,
      pageLanguage: 'auto',
      includedLanguages: 'zh-CN,zh-TW,en,ja,ru'
    }, 'google_translate_element');
  };
