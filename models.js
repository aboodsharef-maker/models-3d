// Add new models here. GLB units are metres; dimensions below are centimetres.
window.MODELS = [{
  id: 'white-cage', name: 'القفص الأبيض', category: 'حديد وأعمال خارجية',
  description: 'هيكل أبيض بخطوط واضحة، وشبك محيط، وسقف من العشب الصناعي الأخضر يميل للأمام؛ الخلف أعلى بـ10 سم. باب أمامي يفتح للخارج لتجربة المساحة من كل زاوية.',
  src: 'models/white-cage.glb?v=20261031-slope', fallback: 'models/cage.html?v=20261031-slope',
  dimensions: ['150', '110', '110', '120'], dimensionLabels: ['العرض / سم', 'العمق / سم', 'الأمام / سم', 'الخلف / سم'], summaryDimensions: '150 × 110 سم · أمام 110 / خلف 120',
  specs: ['بوكس حديد أبيض 3 × 3 سم', 'فتحة باب صافية 80 × 104 سم', 'ضلفة باب 79 × 103 سم', 'شبك أبيض · أرضية مفتوحة', 'السقف: أمام 110 / خلف 120 سم'],
  animation: 'DoorOpen', note: 'مجسّم توضيحي للعرض، وليس مخطط تصنيع معتمدًا. فتحات الشبك توضيحية.'
}];
