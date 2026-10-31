import { Component, type ReactNode } from 'react';
export class PageBoundary extends Component<{children:ReactNode;onHome:()=>void;exportBackup:()=>void},{error:boolean}>{
state={error:false};static getDerivedStateFromError(){return {error:true};}
render(){if(this.state.error)return <section className="glass panel"><div className="empty"><h2>تعذّر عرض هذه الصفحة</h2><p>يمكنكِ العودة للرئيسية أو تنزيل نسخة من دفتركِ دون فقد بياناته.</p><button className="button primary" onClick={this.props.onHome}>العودة للرئيسية</button><button className="button soft" onClick={this.props.exportBackup}>تصدير نسخة من الدفتر</button></div></section>;return this.props.children;}
}
