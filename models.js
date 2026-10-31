// Add new models here. GLB units are metres; dimensions below are centimetres.
window.MODELS = [{
  id: 'white-cage', name: 'القفص الأبيض', category: 'حديد وأعمال خارجية',
  description: 'هيكل أبيض بخطوط واضحة، وشبك محيط، وسقف من العشب الصناعي الأخضر. باب أمامي يفتح للخارج لتجربة المساحة من كل زاوية.',
  src: 'models/white-cage.glb', fallback: 'models/cage.html',
  dimensions: ['150', '110', '120'],
  specs: ['بوكس حديد أبيض 3 × 3 سم', 'فتحة باب صافية 80 × 114 سم', 'ضلفة باب 79 × 113 سم', 'شبك أبيض · أرضية مفتوحة', 'سقف عشب صناعي أخضر'],
  animation: 'DoorOpen', note: 'مجسّم توضيحي للعرض، وليس مخطط تصنيع معتمدًا. فتحات الشبك توضيحية.'
}];
