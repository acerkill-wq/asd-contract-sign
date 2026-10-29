/* Общие настройки договора (одинаковые на сайте и в Google Apps Script).
   ВАЖНО: цены и названия тарифов проверить и дополнить (сейчас подтверждён только один — из договора 55251632). */
var CONTRACT_CFG = {
  executor: {
    name: 'Валиев Руслан Ринатович',
    short: 'Валиев Р.Р.',
    license: '№ 10208 от 14 января 2019г.',
    inn: '165708259956',
    account: '40802810007500000130',
    bank: 'ООО «Банк Точка» г. Москва',
    bik: '044525104',
    corr: '30101810745374525104',
    address: '420015, г. Казань, ул. Пушкина, 52, офис 306-3',
    email: 'info@academia-bti.ru'
  },
  executorSignature: null,
  tariffs: [
    { id: 'pro', name: 'Курс Сметное дело для начинающих. P', hours: 250, price: 59900, months: 12 }
    /* { id: 'base', name: '...', hours: 250, price: 0, months: 12 }, */
  ]
};
if (typeof module !== 'undefined') module.exports = CONTRACT_CFG;
