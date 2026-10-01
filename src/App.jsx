import { useEffect, useState } from 'react'
import {
  Anchor, ArrowRight, Bell, Boat, BookOpenText, CaretDown, CaretLeft, CaretRight,
  ChartBar, Check, CheckCircle, Clock, Compass, Gear, Info, ListChecks, MagnifyingGlass,
  MapPin, Moon, NavigationArrow, Pause, Play, Plus, ShieldCheck, Siren, SpeakerHigh,
  User, Users, Warning, X,
} from '@phosphor-icons/react'

const initialBoats = [
  { id: 'MB-01', name: '달빛 01', status: '정상', battery: 82, passengers: 2, speed: 4.2, tone: 'normal', phase: 2.5, step: .018 },
  { id: 'MB-02', name: '달빛 02', status: '정상', battery: 67, passengers: 2, speed: 4.8, tone: 'normal', phase: 4.35, step: .021 },
  { id: 'MB-03', name: '달빛 03', status: '주의', battery: 18, passengers: 2, speed: 5.8, tone: 'warn', phase: .55, step: .024 },
]

const boatCatalog = [
  { type:'문보트', subtitle:'무장애 탑승 지원', price:25000, duration:'30분', capacity:2, accessible:true, color:'moon', description:'휠체어 고정장치와 이동식 경사판을 지원합니다.' },
  { type:'별보트', subtitle:'야경 감상형', price:22000, duration:'30분', capacity:2, accessible:false, color:'star', description:'조용한 야간 수변 경관 감상에 적합합니다.' },
  { type:'UFO 보트', subtitle:'가족 체험형', price:30000, duration:'35분', capacity:2, accessible:false, color:'ufo', description:'조명과 음악을 함께 즐기는 체험형 보트입니다.' },
]
const tripPlaces=[
  {name:'개목나루 나루터',story:'황포돛배가 드나들던 개목나루의 옛 모습과 오늘의 문보트 나루터입니다.',distance:'약 547m',remaining:'약 25분'},
  {name:'영락교',story:'낙동강 물길과 안동의 야경을 함께 바라볼 수 있는 영락교 구간입니다.',distance:'약 320m',remaining:'약 18분'},
  {name:'달빛 포토존',story:'수면 위 조명과 달빛을 가까이에서 감상하는 포토존입니다.',distance:'약 140m',remaining:'약 10분'},
  {name:'월영교',story:'월영교의 야경을 바라보며 회항 지점으로 이동합니다.',distance:'도착',remaining:'약 5분'},
]

function withTelemetry(boat) {
  const x = 52 + Math.cos(boat.phase) * 27
  const y = 51 + Math.sin(boat.phase) * 31
  return {
    ...boat, x, y,
    lat: 36.5782 + (50 - y) * .000035,
    lng: 128.7659 + (x - 50) * .000055,
    heading: Math.round(((boat.phase * 180 / Math.PI) + 90) % 360),
    accuracy: 5 + (Number(boat.id.slice(-1)) % 3),
  }
}

const navItems = [
  { id: 'live', label: '실시간 관제', icon: NavigationArrow },
  { id: 'bookings', label: '예약·배정', icon: Users },
  { id: 'safety', label: '안전 관리', icon: ShieldCheck },
  { id: 'content', label: '관광 콘텐츠', icon: BookOpenText },
  { id: 'reports', label: '운항 보고서', icon: ChartBar },
  { id: 'operations', label: '운영 설정', icon: ListChecks },
  { id: 'system', label: '시스템', icon: Gear },
]

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}
function formatDateKo(value){
  if(!value) return ''
  const [year,month,day]=value.split('-').map(Number)
  return `${year}년 ${month}월 ${day}일`
}

function Brand({ admin = false }) {
  return <div className="brand">
    <span className="brand-mark"><Moon weight="fill" /></span>
    <div><strong>{admin ? 'NARU MOONBOAT' : '나루의 밤'}</strong><small>{admin ? '운영 관제 시스템' : '개목나루 황포돛배 문보트 나루터'}</small></div>
  </div>
}

function ModeSwitch({ admin, onChange }) {
  return <button className={`mode-switch ${admin ? 'dark' : ''}`} onClick={() => onChange(admin ? 'guest' : 'admin')}>
    <span>서비스 전환</span><b>{admin ? '탑승자 화면' : '운영자 화면'}</b><ArrowRight />
  </button>
}

function App() {
  const [mode, setMode] = useState(()=>new URLSearchParams(window.location.search).get('mode')==='admin'?'admin':'guest')
  const [service, setService] = useState(()=>{
    try { return JSON.parse(localStorage.getItem('naru-demo-service')) || { reservation:null, alerts:[] } }
    catch { return { reservation:null, alerts:[] } }
  })
  const [accessibility,setAccessibility]=useState({large:false,motion:true,voice:true})
  useEffect(()=>{ localStorage.setItem('naru-demo-service',JSON.stringify(service)) },[service])
  useEffect(()=>{
    const sync=e=>{ if(e.key==='naru-demo-service'&&e.newValue) setService(JSON.parse(e.newValue)) }
    window.addEventListener('storage',sync)
    return ()=>window.removeEventListener('storage',sync)
  },[])
  return <div className={`${accessibility.large?'app-large-type':''} ${accessibility.motion?'':'reduce-motion'}`}>
    {mode === 'guest'
      ? <GuestApp service={service} setService={setService} accessibility={accessibility} setAccessibility={setAccessibility} />
      : <AdminApp onMode={setMode} service={service} setService={setService} />}
  </div>
}

function GuestApp({ service, setService, accessibility, setAccessibility }) {
  const saved=service.reservation
  const [step, setStep] = useState(saved?(saved.state==='탑승 중'?'ride':'complete'):'catalog')
  const [name, setName] = useState(saved?.name||'')
  const [phone, setPhone] = useState(saved?.phone||'')
  const [date, setDate] = useState(saved?.date||'2026-10-03')
  const [time, setTime] = useState(saved?.time||'19:30')
  const [boatType, setBoatType] = useState(saved?.boatType||'문보트')
  const [passengers, setPassengers] = useState(saved?.passengers||2)
  const [supports, setSupports] = useState(saved?.supports||['휠체어 탑승'])
  const [payment, setPayment] = useState(saved?.payment||'현장 결제')
  const [consent, setConsent] = useState(Boolean(saved))
  const [checks, setChecks] = useState([false, false])
  const [tab, setTab] = useState('trip')
  const [playing, setPlaying] = useState(true)
  const [tripStage,setTripStage]=useState(0)
  const [toast, setToast] = useState('')
  const ready = name.trim() && phone.replace(/\D/g, '').length >= 10 && date && time && boatType && passengers > 0 && consent
  const missing=[!name.trim()&&'이름',phone.replace(/\D/g,'').length<10&&'연락처',!consent&&'개인정보 이용 동의'].filter(Boolean)
  const allChecked = checks.every(Boolean) && service.reservation?.staffChecked

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }
  function announce(message) {
    notify(message)
    if(accessibility.voice&&'speechSynthesis'in window){
      window.speechSynthesis.cancel()
      const utterance=new SpeechSynthesisUtterance(message)
      utterance.lang='ko-KR'
      window.speechSynthesis.speak(utterance)
    }
  }
  function submitReservation() {
    setService({
      reservation:{id:'R-1038',name,phone,date,time,boatType,passengers,supports,payment,price:selectedProduct.price,state:'승인 대기',staffChecked:false},
      alerts:service.alerts||[],
    })
    setStep('complete')
  }

  const selectedProduct = boatCatalog.find(item=>item.type===boatType)
  useEffect(()=>{
    if(step!=='ride'||!accessibility.motion) return undefined
    const timer=window.setInterval(()=>setTripStage(v=>Math.min(tripPlaces.length-1,v+1)),8000)
    return ()=>window.clearInterval(timer)
  },[step,accessibility.motion])
  useEffect(()=>{
    if(step!=='ride'||!playing||!accessibility.voice||!('speechSynthesis'in window)) return
    const utterance=new SpeechSynthesisUtterance(`${tripPlaces[tripStage].name}. ${tripPlaces[tripStage].story}`)
    utterance.lang='ko-KR';window.speechSynthesis.cancel();window.speechSynthesis.speak(utterance)
  },[step,tripStage,playing,accessibility.voice])

  if (step === 'catalog') return <div className="guest-shell welcome-shell">
    <header className="guest-header"><Brand /></header>
    <main className="catalog-main">
      <section className="catalog-hero"><span className="eyebrow">개목나루 수상레저</span><h1>오늘 이용할 보트를<br />선택하세요</h1><div className="catalog-facts"><span><Clock/> 약 30분</span><span><Users/> 최대 2명</span><span><ShieldCheck/> 안전요원 운영</span></div></section>
      <section className="catalog-list" aria-label="이용 가능한 보트">
        {boatCatalog.map(item=><article className={`product-card ${item.color}`} key={item.type}>
          <div className="product-visual"><Boat weight="fill"/><span>{item.accessible?'무장애 지원':'일반 탑승'}</span></div>
          <div className="product-content"><div><h2>{item.type}</h2><small>{item.subtitle}</small></div><p>{item.description}</p>{item.accessible&&<ul className="access-specs"><li>휠체어 최대 70 × 120cm</li><li>휠체어 중량 80kg 이하</li><li>경사판·고정장치·직원 보조</li></ul>}<dl><div><dt>이용 시간</dt><dd>{item.duration}</dd></div><div><dt>정원</dt><dd>{item.capacity}명</dd></div><div><dt>요금</dt><dd>{item.price.toLocaleString()}원</dd></div></dl><button onClick={()=>{setBoatType(item.type);setStep('welcome')}}>{item.type} 선택 <ArrowRight/></button></div>
        </article>)}
      </section>
      <section className="access-location"><h2>무장애 방문 안내</h2><div><span><MapPin/></span><b>장애인 주차구역</b><small>탑승장 입구까지 약 80m</small></div><div><span><User/></span><b>장애인 화장실</b><small>관광안내소 1층</small></div><div><span><NavigationArrow/></span><b>이동 경로</b><small>경사 없는 데크길 이용</small></div></section>
      <button className="walkin-card" onClick={()=>{setBoatType('문보트');setStep('welcome')}}><Info weight="fill"/><div><b>예약 없이 방문하셨나요?</b><p>현재 이용 가능한 회차를 확인하세요.</p></div><ArrowRight/></button>
    </main>
  </div>

  if (step === 'welcome') return <div className="guest-shell welcome-shell">
    <header className="guest-header"><Brand /><button className="round-button" onClick={()=>setStep('catalog')}><CaretLeft/> 보트 선택</button></header>
    <main className="onboard-wrap">
      <section className="onboard-card">
        <div className="flow-progress" aria-label="예약 3단계 중 1단계"><span role="img" aria-label="1단계 예약 정보 입력" className="active">1</span><i /><span role="img" aria-label="2단계 결제">2</span><i /><span role="img" aria-label="3단계 승인 요청 완료">3</span><b>예약 정보 입력</b></div>
        <span className="eyebrow">예약·탑승 준비</span>
        <h1>나에게 맞는 보트와<br />이용 시간을 선택하세요</h1>
        <p><b>개목나루 수상레저 나루터</b></p>
        <div className="form-grid">
          <label>이름<input value={name} onChange={e => setName(e.target.value)} placeholder="탑승자 이름" /></label>
          <label>연락처<input value={phone} onChange={e => setPhone(formatPhone(e.target.value))} placeholder="010-0000-0000" inputMode="numeric" autoComplete="tel" maxLength={13} /></label>
          <div className="field-pair">
            <label>이용 날짜<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
            <label>회차<select value={time} onChange={e => setTime(e.target.value)}><option>18:30</option><option>19:30</option><option>20:30</option></select></label>
          </div>
          <fieldset className="choice-field"><legend>보트 종류</legend><div className="boat-choices">{[
            ['문보트','휠체어 탑승 지원'],['별보트','야경 감상형'],['UFO 보트','가족 체험형'],
          ].map(([type,desc])=><button type="button" key={type} aria-pressed={boatType===type} className={boatType===type?'active':''} onClick={()=>setBoatType(type)}><Boat /><b>{type}</b><small>{desc}</small>{boatType===type&&<CheckCircle weight="fill" />}</button>)}</div></fieldset>
          <div className="count-field"><span><b>탑승 인원</b><small className="meta-copy">선택한 보트의 정원은 최대 2명입니다.</small></span><div><button type="button" aria-label="인원 줄이기" onClick={()=>setPassengers(v=>Math.max(1,v-1))}>−</button><b>{passengers}명</b><button type="button" aria-label="인원 늘리기" onClick={()=>setPassengers(v=>Math.min(2,v+1))}>＋</button></div></div>
          <fieldset className="choice-field"><legend>필요한 이용 지원</legend><div className="support-grid">{['휠체어 탑승','이동식 경사판','보호자 동승','승하선 직원 지원','음성 안내','큰 글자 안내'].map(item=><label key={item} className={supports.includes(item)?'active':''}><input type="checkbox" checked={supports.includes(item)} onChange={()=>setSupports(v=>v.includes(item)?v.filter(x=>x!==item):[...v,item])} /><span>{item}</span></label>)}</div></fieldset>
          <label className="check-line"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>안내와 안전 연락 수신, 개인정보 이용에 동의합니다</span></label>
        </div>
        <div className="booking-summary"><span>{formatDateKo(date)} · {time}</span><b>{boatType} · {passengers}명</b><small>{supports.length ? supports.join(' · ') : '추가 지원 없음'}</small></div>
        {missing.length>0&&<div className="form-errors" role="status"><b>입력이 필요합니다.</b><span>{missing.join(' · ')}</span></div>}
        <button className="primary" disabled={!ready} onClick={() => setStep('payment')}>요금 확인·결제 <ArrowRight /></button>
      </section>
    </main>
  </div>

  if (step === 'payment') return <div className="guest-shell welcome-shell">
    <header className="guest-header"><Brand /><button className="round-button" onClick={()=>setStep('welcome')}><CaretLeft/> 이전</button></header>
    <main className="onboard-wrap"><section className="onboard-card payment-screen">
      <span className="eyebrow">결제</span><h1>결제 금액을<br />확인하세요</h1>
      <div className="price-sheet"><div><span>{boatType} · {selectedProduct.duration}</span><b>{selectedProduct.price.toLocaleString()}원</b></div><div><span>탑승 인원</span><b>{passengers}명</b></div><div><span>할인</span><b>0원</b></div><div className="price-total"><span>최종 결제금액</span><b>{selectedProduct.price.toLocaleString()}원</b></div></div>
      <fieldset className="choice-field payment-methods"><legend>결제 방법</legend>{['현장 결제','신용·체크카드','간편결제'].map(method=><button type="button" key={method} aria-pressed={payment===method} className={payment===method?'active':''} onClick={()=>setPayment(method)}><span>{method}</span>{payment===method&&<CheckCircle weight="fill"/>}</button>)}</fieldset>
      <div className="refund-box"><b>취소·환불</b><span>이용 1일 전까지 전액 환불 · 당일 취소는 현장 문의</span></div>
      <button className="primary" onClick={submitReservation}>{payment==='현장 결제'?'예약 요청하기':`${selectedProduct.price.toLocaleString()}원 결제 후 예약 요청`} <ArrowRight/></button>
    </section></main>
  </div>

  if (step === 'complete') return <div className="guest-shell welcome-shell">
    <header className="guest-header"><Brand /></header><main className="onboard-wrap"><section className="onboard-card complete-screen">
      <Clock weight="fill" className="complete-icon"/><span className="eyebrow" aria-live="polite">{service.reservation?.state||'승인 대기'}</span><h1>{name}님의 {service.reservation?.state==='승인 대기'?'예약 요청을 접수했습니다':'예약이 승인되었습니다'}</h1>
      <div className="confirmation-card"><small>예약번호</small><strong>R-1038</strong><dl><div><dt>이용 일시</dt><dd>{formatDateKo(date)} · {time}</dd></div><div><dt>이용 보트</dt><dd>{boatType} · {passengers}명</dd></div><div><dt>결제</dt><dd>{payment==='현장 결제'?'현장 결제 예정':`${selectedProduct.price.toLocaleString()}원 승인`}</dd></div><div><dt>요청 지원</dt><dd>{supports.join(' · ')||'없음'}</dd></div><div><dt>탑승 장소</dt><dd>개목나루 수상레저 나루터</dd></div></dl></div>
      <div className="arrival-note"><MapPin weight="fill"/><div><b>시작 15분 전 도착</b><span>예약자 이름과 연락처로 현장 확인합니다.</span></div></div>
      {service.reservation?.state==='승인 대기'?<button className="primary" disabled>운영자 승인 대기</button>:<button className="primary" onClick={()=>setStep('briefing')}>안전 안내 확인 <ArrowRight/></button>}<button className="secondary full" onClick={()=>setStep('catalog')}>다른 보트 보기</button>
    </section></main>
  </div>

  if (step === 'briefing') return <div className="guest-shell welcome-shell">
    <header className="guest-header"><Brand /><button className="round-button" onClick={() => setStep('complete')}><CaretLeft /> 이전</button></header>
    <main className="onboard-wrap">
      <section className="onboard-card">
        <span className="eyebrow">안전 안내</span><h1>출발 전 세 가지만<br />확인해 주세요</h1>
        <div className="briefing-list">
          {[
            ['구명조끼 착용', '운항 중에는 구명조끼를 벗지 않습니다.'],
            ['비상 상황 안내', '화면·음성·진동 알림이 오면 운영자의 안내를 따릅니다.'],
          ].map(([title, desc], i) => <button key={title} aria-pressed={checks[i]} className={checks[i] ? 'checked' : ''} onClick={() => setChecks(v => v.map((x, j) => j === i ? !x : x))}>
            <span className="check-dot">{checks[i] ? <Check weight="bold" /> : i + 1}</span><span><b>{title}</b><small>{desc}</small></span>
          </button>)}
          <div className={`staff-check ${service.reservation?.staffChecked?'checked':''}`}><span className="check-dot">{service.reservation?.staffChecked?<Check weight="bold"/>:<User/>}</span><span><b>직원 안전 확인</b><small>경사판, 휠체어 고정장치와 승선 상태를 직원이 확인합니다.</small></span></div>
        </div>
        <button className="primary" disabled={!allChecked} onClick={() => {setService(v=>({...v,reservation:{...v.reservation,state:'탑승 중'}}));setStep('ride')}}>{service.reservation?.staffChecked?'탑승 시작':'직원 확인 대기'} <Boat weight="fill" /></button>
      </section>
    </main>
  </div>

  if(step==='end') return <div className="guest-shell welcome-shell"><header className="guest-header"><Brand/></header><main className="onboard-wrap"><section className="onboard-card complete-screen"><CheckCircle weight="fill" className="complete-icon"/><span className="eyebrow">이용 완료</span><h1>안전하게 하선했습니다</h1><div className="arrival-note"><Info weight="fill"/><div><b>소지품과 휠체어 상태를 확인하세요.</b><span>도움이 필요하면 현장 직원에게 말씀해 주세요.</span></div></div><button className="primary" onClick={()=>{setName('');setPhone('');setSupports([]);setConsent(false);setChecks([false,false]);setService({reservation:null,alerts:[]});setStep('catalog')}}>확인하고 종료</button></section></main></div>

  return <div className="guest-shell ride-shell">
    <header className="guest-header"><Brand /><button className="round-button" onClick={() => setStep('end')}>이용 종료</button></header>
    <div className="sr-live" aria-live="assertive" aria-atomic="true">{toast}</div>{toast && <div className="toast"><CheckCircle weight="fill" /> {toast}</div>}
    <main className="ride-main">
      {tab === 'trip' && <>
        <section className="night-scene" aria-label="개목나루 야간 운항 장면">
          <Moon weight="fill" className="scene-moon" />
          <div className="scene-stars">· · · · ·</div>
          <div className="scene-route"><Boat weight="fill" /></div>
          <div className="scene-caption"><span>{tripStage===0?'지금 여기':'이동 중'}</span><h1>{tripPlaces[tripStage].name}</h1></div>
        </section>
        <section className="guest-card story-card">
          <h2>{tripPlaces[tripStage].name}</h2><p>{tripPlaces[tripStage].story}</p>
          <button className="audio-button" aria-pressed={playing} onClick={() => {const next=!playing;setPlaying(next);if(next)announce(`${tripPlaces[tripStage].name}. ${tripPlaces[tripStage].story}`);else if('speechSynthesis'in window)window.speechSynthesis.cancel()}}>{playing ? <Pause weight="fill" /> : <Play weight="fill" />} {playing ? '잠시 멈춤' : '다시 듣기'}</button>
          <div className="progress"><i style={{ width: `${25+(tripStage*25)}%` }} /></div>
          <div className="audio-meta"><span>{playing ? '도착해서 자동으로 재생 중입니다' : '안내가 일시 정지되었습니다'}</span><em>음성 안내</em></div>
        </section>
        <section className="guest-card gps-card"><MapPin weight="fill" /><p><b>MB-03 달빛 03</b></p><em>실시간 위치</em><code>{tripPlaces[tripStage].name} · {tripPlaces[tripStage].distance}</code></section>
        <section className="fact-grid">
          <div><small>현재 장소</small><b>{tripPlaces[tripStage].name}</b></div><div><small>남은 거리</small><b>{tripPlaces[tripStage].distance}</b></div><div><small>남은 시간</small><b>{tripPlaces[tripStage].remaining}</b></div><div><small>배 상태</small><b>{service.alerts?.some(x=>x.type==='danger'&&!x.resolved)?'주의구역 접근':'정상 운항'}</b></div>
        </section>
        <section className="nearby"><div className="section-title"><h2>둘러보기</h2></div><div className="place-strip">
          {tripPlaces.map((place, i) => <button key={place.name} className={i === tripStage ? 'active' : ''} onClick={() => {setTripStage(i);notify(`${place.name} 안내를 열었습니다`)}}><span><Anchor /></span><small>{i === tripStage ? '현재 위치' : i<tripStage?'지나온 장소':'곧 지나갑니다'}</small><b>{place.name}</b><em>{place.story}</em></button>)}
        </div></section>
      </>}
      {tab === 'safety' && <SafetyScreen onNotify={announce} service={service} setService={setService} />}
      {tab === 'booking' && <BookingScreen onNotify={notify} reservation={{name,date,time,boatType,passengers,supports}} />}
      {tab === 'settings' && <SettingsScreen accessibility={accessibility} setAccessibility={setAccessibility} />}
    </main>
    <nav className="guest-nav">
      {[['trip','운항 안내',Compass],['booking','예약·탑승',ListChecks],['safety','안전 안내',ShieldCheck],['settings','화면 설정',Gear]].map(([id,label,Icon]) => <button key={id} className={tab===id?'active':''} onClick={() => setTab(id)}><Icon weight={tab===id?'fill':'regular'} /><span>{label}</span></button>)}
    </nav>
  </div>
}

function SafetyScreen({ onNotify, service, setService }) {
  const sendAlert=(type,message)=>{
    const alert={id:Date.now(),type,message,time:new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}),resolved:false}
    setService(v=>({...v,alerts:[alert,...(v.alerts||[])]}))
    if(type==='danger'&&navigator.vibrate) navigator.vibrate([300,150,300])
    onNotify(message)
  }
  return <section className="screen-stack"><div className="page-heading"><span className="eyebrow">안전 안내</span><h1>운항 중 안전을<br />함께 지켜 주세요</h1></div>
    <div className={`guest-card safety-state ${service.alerts?.some(x=>x.type==='danger'&&!x.resolved)?'danger-state':''}`}><CheckCircle weight="fill" /><div><b>{service.alerts?.some(x=>x.type==='danger'&&!x.resolved)?'주의구역에 접근했습니다':'현재 운항 상태는 정상입니다'}</b><small>{service.alerts?.some(x=>x.type==='danger'&&!x.resolved)?'화면·음성·진동 안내를 확인하세요.':'가장 가까운 주의구역까지 228m'}</small></div></div>
    {[[Siren,'경광등·스피커 알림','위험구역 진입 시 즉시 작동합니다.'],[MapPin,'GPS 위험구역 관리','현재 위치를 기준으로 접근을 안내합니다.'],[Bell,'위험상황 SMS','필요 시 등록한 연락처로 발송합니다.']].map(([Icon,title,desc])=><div className="guest-card info-row" key={title}><span><Icon /></span><div><b>{title}</b><small>{desc}</small></div><Check /></div>)}
    <button className="danger-demo" onClick={()=>sendAlert('danger','주의구역에 접근했습니다. 운영자의 안내를 따라 주세요.')}><Siren weight="fill"/> 위험구역 알림 시연</button>
    <button className="emergency" onClick={() => sendAlert('help',`${service.reservation?.name||'탑승자'}님이 도움을 요청했습니다.`)}><Warning weight="fill" /> 운영자에게 도움 요청</button>
  </section>
}

function BookingScreen({ onNotify, reservation }) {
  return <section className="screen-stack"><div className="page-heading"><span className="eyebrow">예약·탑승</span><h1>나의 이용 정보</h1></div>
    <div className="guest-card ticket"><div className="ticket-head"><span>{formatDateKo(reservation.date)} · {reservation.time}</span><em>탑승 중</em></div><h2>{reservation.boatType} · MB-03 달빛 03</h2><p>탑승자 {reservation.name || '홍길동'} · 총 {reservation.passengers}명</p><div className="ticket-supports">{reservation.supports.map(x=><span key={x}>{x}</span>)}</div><div className="onsite-check"><CheckCircle weight="fill"/><div><b>현장 확인 완료</b><small>예약자 이름과 연락처 확인</small></div></div></div>
    <div className="guest-card timeline"><h2>이용 진행</h2>{['예약 확인','현장 확인','안전 안내','운항 시작'].map((x,i)=><div key={x} className="timeline-row"><CheckCircle weight="fill" /><span><b>{x}</b><small>{['18:52 완료','19:18 운영자 승인','19:24 확인 완료','19:31 출발'][i]}</small></span></div>)}</div>
    <div className="booking-actions"><button className="secondary" onClick={() => onNotify('예약 정보를 확인했습니다')}>예약 정보 확인</button><button className="secondary" onClick={() => onNotify('변경 가능한 회차를 불러왔습니다')}>시간 변경</button><button className="cancel-button" onClick={() => onNotify('예약 취소 요청을 접수했습니다')}>예약 취소</button></div>
  </section>
}

function SettingsScreen({accessibility,setAccessibility}) {
  const change=(key,value)=>setAccessibility(v=>({...v,[key]:value}))
  return <section className="screen-stack"><div className="page-heading"><span className="eyebrow">접근성 설정</span><h1>편안하게 이용하세요</h1></div>
    <div className="guest-card setting-card">
      <Toggle label="큰 글자로 보기" desc="전체 화면의 글자를 크게 표시합니다." checked={accessibility.large} onChange={value=>change('large',value)} />
      <Toggle label="화면 움직임 사용" desc="전환 효과와 위치 애니메이션을 사용합니다." checked={accessibility.motion} onChange={value=>change('motion',value)} />
      <Toggle label="자동 음성 안내" desc="관광 지점과 안전 알림을 음성으로 안내합니다." checked={accessibility.voice} onChange={value=>change('voice',value)} />
    </div>
    <div className="guest-card contact-card"><Info weight="fill" /><div><b>도움이 필요하신가요?</b><small>현장 운영자에게 말씀하거나 안전 화면에서 도움을 요청하세요.</small></div></div>
  </section>
}

function Toggle({ label, desc, checked, onChange }) {
  return <label className="toggle-row"><span><b>{label}</b><small className="meta-copy">{desc}</small></span><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} /><i /></label>
}

function AdminApp({ onMode, service, setService }) {
  const [tab, setTab] = useState('live')
  const [selected, setSelected] = useState('MB-03')
  const [panelOpen, setPanelOpen] = useState(true)
  const [eventsOpen, setEventsOpen] = useState(false)
  const [events, setEvents] = useState([
    { time:'19:42', tone:'warn', title:'MB-03 배터리 20% 이하', detail:'교대 또는 회항을 검토하세요.', ack:false },
    { time:'19:37', tone:'normal', title:'MB-02 월영교 콘텐츠 송출', detail:'음성 콘텐츠 자동 재생 완료.', ack:true },
  ])
  const [toast, setToast] = useState('')
  const [simulation, setSimulation] = useState(true)
  const [simBoats, setSimBoats] = useState(()=>initialBoats.map(withTelemetry))
  useEffect(()=>{
    if(!simulation) return undefined
    const timer=window.setInterval(()=>setSimBoats(current=>current.map(boat=>withTelemetry({
      ...boat,
      phase:(boat.phase+boat.step)%(Math.PI*2),
      speed:Math.max(2.8,Math.min(6.2,boat.speed+(Math.random()-.5)*.18)),
      battery:Math.max(0,boat.battery-.004),
    }))),1000)
    return ()=>window.clearInterval(timer)
  },[simulation])
  const boat = simBoats.find(b=>b.id===selected)
  const sharedEvents=(service.alerts||[]).map(alert=>({ ...alert,tone:alert.type==='danger'||alert.type==='help'?'warn':'normal',title:alert.message,detail:`${service.reservation?.name||'탑승자'} · ${service.reservation?.boatType||'문보트'}`,ack:alert.resolved,shared:true }))
  const allEvents=[...sharedEvents,...events]
  function notify(message) { setToast(message); window.setTimeout(()=>setToast(''),2400) }
  function ack(i) { setEvents(v=>v.map((e,j)=>j===i?{...e,ack:true}:e)); notify('이벤트를 확인 처리했습니다') }
  function ackShared(id){setService(v=>({...v,alerts:v.alerts.map(x=>x.id===id?{...x,resolved:true}:x)}));notify('탑승자 요청을 확인 처리했습니다')}
  return <div className="admin-shell">
    <header className="admin-header"><Brand admin /><div className="location"><i /><div><b>개목나루 황포돛배 문보트 나루터</b><small>낙동강(안동) · 영락교 ↔ 월영교</small></div></div><span className="live-chip">SIMULATION · {simulation?'재생 중':'일시 정지'}</span></header>
    <div className="warning-banner"><span>즉시 확인</span><div><small>{sharedEvents.some(x=>!x.ack)?'탑승자 알림':'운항 주의 알림'}</small><b>{sharedEvents.find(x=>!x.ack)?.title||`MB-03 달빛 03 · 배터리 ${Math.floor(simBoats[2].battery)}% · 회항이나 교대를 검토하세요.`}</b></div><button onClick={()=>{setSelected('MB-03');setTab(sharedEvents.some(x=>!x.ack)?'bookings':'live');setPanelOpen(true);setEventsOpen(true)}}>상세 보기 <ArrowRight /></button></div>
    {toast && <div className="admin-toast"><CheckCircle weight="fill" /> {toast}</div>}
    <main className="admin-main">
      <MapBoard boats={simBoats} selected={selected} onSelect={setSelected} />
      <div className="hud"><button className="simulation-control" onClick={()=>setSimulation(v=>!v)}>{simulation?<Pause weight="fill"/>:<Play weight="fill"/>}<b>{simulation?'시뮬레이션 정지':'시뮬레이션 재생'}</b></button><span><b>3척</b> 운항 · 탑승 {simBoats.reduce((sum,b)=>sum+b.passengers,0)}명</span><span className="states"><i />2 <i />1 <i />0</span><button onClick={()=>setEventsOpen(true)}>미확인 경보 <b>{allEvents.filter(e=>!e.ack).length}</b></button></div>
      <nav className="admin-nav">{navItems.map(({id,label,icon:Icon})=><button key={id} className={tab===id?'active':''} onClick={()=>{setTab(id);setPanelOpen(true)}}><Icon weight={tab===id?'fill':'regular'} /><span>{label}</span></button>)}</nav>
      {panelOpen && <aside className="admin-panel"><div className="panel-head"><div><b>{navItems.find(x=>x.id===tab).label}</b>{tab==='live'&&<small>GPS 모의 신호 · 1초 간격 갱신</small>}</div><button onClick={()=>setPanelOpen(false)}><CaretLeft /> 접기</button></div><div className="panel-body"><PanelContent tab={tab} boats={simBoats} boat={boat} selected={selected} onSelect={setSelected} notify={notify} service={service} setService={setService} /></div></aside>}
      {!panelOpen && <button className="panel-reopen" onClick={()=>setPanelOpen(true)}><CaretRight /> 작업 패널 열기</button>}
      <aside className={`event-drawer ${eventsOpen?'open':''}`}><button className="event-toggle" onClick={()=>setEventsOpen(!eventsOpen)}>{eventsOpen?<CaretDown />:<CaretRight />} 이벤트 이력 {allEvents.length}건</button>{eventsOpen&&<div className="event-list">{allEvents.map((e,i)=><article key={e.id||`${e.time}-${i}`} className={e.tone}><time>{e.time}</time><div><b>{e.title}</b><small>{e.detail}</small></div>{e.ack?<em>확인됨</em>:<button onClick={()=>e.shared?ackShared(e.id):ack(i-sharedEvents.length)}>확인</button>}</article>)}</div>}</aside>
    </main>
    <ModeSwitch admin onChange={onMode} />
  </div>
}

function MapBoard({ boats, selected, onSelect }) {
  return <div className="map-board" aria-label="문보트 운항 지도">
    <div className="river-label">낙동강 · 안동호</div>
    <div className="route-line one" /><div className="route-line two" />
    <div className="zone tour z1"><span>관광</span></div><div className="zone caution z2"><span>주의</span></div><div className="zone tour z3"><span>월영교</span></div><div className="zone danger z4"><span>제한</span></div>
    {boats.map(b=><button key={b.id} className={`boat-pin ${b.tone} ${selected===b.id?'selected':''}`} style={{left:`${b.x}%`,top:`${b.y}%`}} onClick={()=>onSelect(b.id)}><span style={{transform:`rotate(${b.heading}deg)`}}><NavigationArrow weight="fill" /></span><b>{b.id}</b></button>)}
    <div className="map-legend"><Compass /><span><i />정상</span><span><i />주의</span><span><i />제한</span></div>
  </div>
}

function PanelContent({ tab, boats, boat, selected, onSelect, notify, service, setService }) {
  if(tab==='live') return <><div className="fleet-list">{boats.map(b=><button key={b.id} className={`fleet-item ${b.tone} ${selected===b.id?'active':''}`} onClick={()=>onSelect(b.id)}><Status tone={b.tone}>{b.status}</Status><span><b>{b.id} · {b.name}</b><small>배터리 {Math.floor(b.battery)}% · {b.speed.toFixed(1)} km/h · 탑승 {b.passengers}명</small></span><CaretRight /></button>)}</div><BoatDetail boat={boat} notify={notify} /></>
  if(tab==='bookings') return <BookingAdminPanel notify={notify} service={service} setService={setService} />
  if(tab==='safety') return <SafetyPanel notify={notify} />
  if(tab==='content') return <ContentPanel notify={notify} />
  if(tab==='reports') return <ReportsPanel />
  if(tab==='operations') return <OperationsPanel notify={notify} />
  return <SystemPanel notify={notify} />
}

function Status({tone,children}) { return <em className={`status ${tone}`}><i />{children}</em> }

function BoatDetail({ boat, notify }) {
  return <section className="detail-card"><div className="detail-title"><Status tone={boat.tone}>{boat.status}</Status><b>{boat.id} · {boat.name}</b><span className="telemetry-pulse">수신 중</span></div><dl className="data-grid"><div><dt>GPS 위치</dt><dd>{boat.lat.toFixed(5)}, {boat.lng.toFixed(5)}</dd></div><div><dt>속도</dt><dd>{boat.speed.toFixed(1)} km/h</dd></div><div><dt>배터리</dt><dd className={boat.battery<25?'danger-text':''}>{Math.floor(boat.battery)}%</dd></div><div><dt>진행 방향</dt><dd>{boat.heading}°</dd></div><div><dt>GPS 정확도</dt><dd>±{boat.accuracy}m</dd></div><div><dt>최근 수신</dt><dd>1초 이내</dd></div><div><dt>탑승</dt><dd>{boat.passengers}명</dd></div><div><dt>통신 상태</dt><dd>LTE 양호</dd></div></dl><h3>이 문보트에 조치</h3><div className="action-grid">{[[Siren,'경광등 작동'],[SpeakerHigh,'스피커 송출'],[Gear,'미니 PC 점검']].map(([Icon,label])=><button key={label} onClick={()=>notify(`${boat.id} ${label} 명령을 전송했습니다`)}><Icon /><span>{label}</span></button>)}</div></section>
}

function SafetyPanel({notify}) {
  const [sms,setSms]=useState('')
  return <><h3 className="panel-section-title">위험구역 정책</h3>{[['영락교 접근','관광','tour'],['회항 권고 수역','주의','warn'],['운항 제한 수역','제한','danger']].map(([n,s,t])=><div className="policy" key={n}><span className={t}>{s}</span><div><b>{n}</b><small>진입 시 자동 알림 · 반경 120m</small></div><button onClick={()=>notify(`${n} 설정을 열었습니다`)}>수정</button></div>)}<h3 className="panel-section-title">SMS 즉시 발송</h3><div className="sms-box"><textarea value={sms} onChange={e=>setSms(e.target.value)} placeholder="안전 안내 메시지를 입력하세요" /><button disabled={!sms.trim()} onClick={()=>{notify('지정 연락처로 SMS를 발송했습니다');setSms('')}}>선택 탑승자에게 발송</button></div></>
}

function ContentPanel({notify}) { return <>{['개목나루 나루터','영락교','달빛 포토존','월영교'].map((x,i)=><div className="content-row" key={x}><span>{String(i+1).padStart(2,'0')}</span><div><b>{x}</b><small>음성 · 자막 · 이미지 {i===0?'재생 중':'준비됨'}</small></div><button onClick={()=>notify(`${x} 미리보기를 재생합니다`)}><Play weight="fill" /></button></div>)}<button className="accent-action" onClick={()=>notify('새 관광 콘텐츠 편집기를 열었습니다')}><Plus /> 콘텐츠 추가</button></> }

function ReportsPanel() { return <><div className="report-grid"><div><small>완료 운항</small><b>18</b><em>회</em></div><div><small>총 탑승자</small><b>34</b><em>명</em></div><div><small>평균 운항</small><b>31</b><em>분</em></div><div><small>안전 이벤트</small><b>2</b><em>건</em></div></div><h3 className="panel-section-title">최근 운항</h3>{['MB-01 · 18:40 완료','MB-02 · 18:52 완료','MB-03 · 운항 중'].map((x,i)=><div className="report-row" key={x}><Boat /><span>{x}</span><b>{[28,34,19][i]}분</b></div>)}</> }

function BookingAdminPanel({notify,service,setService}) {
  const [filter,setFilter]=useState('전체')
  const [reservations,setReservations]=useState([
    {id:'R-1037',time:'19:30',name:'김나루',type:'별보트',people:2,support:'추가 지원 없음',state:'승인 완료',boat:'MB-02'},
    {id:'R-1036',time:'20:30',name:'이안동',type:'UFO 보트',people:2,support:'보호자 동승·음성 안내',state:'현장 확인',boat:'UB-01'},
  ])
  const guest=service.reservation?{id:service.reservation.id,time:service.reservation.time,name:service.reservation.name,type:service.reservation.boatType,people:service.reservation.passengers,support:service.reservation.supports.join(' · ')||'추가 지원 없음',state:service.reservation.state,boat:'MB-03',shared:true}:null
  const all=guest?[guest,...reservations]:reservations
  const update=(id,patch)=>{if(id==='R-1038'&&guest)setService(v=>({...v,reservation:{...v.reservation,...patch}}));else setReservations(v=>v.map(r=>r.id===id?{...r,...patch}:r))}
  const list=filter==='전체'?all:all.filter(r=>r.state===filter)
  const approve=r=>{update(r.id,{state:'승인 완료'});notify(`${r.id} 예약을 승인했습니다`)}
  const board=r=>{update(r.id,{state:'탑승 준비',staffChecked:true});notify(`${r.id} 경사판과 고정장치 확인을 완료했습니다`)}
  return <><div className="admin-metrics"><div><b>{all.length}</b><small>오늘 예약</small></div><div><b>{all.filter(x=>x.state==='승인 대기').length}</b><small>승인 대기</small></div><div><b>{all.filter(x=>x.support!=='추가 지원 없음').length}</b><small>지원 요청</small></div></div><button className="bulk-notice" onClick={()=>notify('오늘 예약자 전체에게 운영 안내를 발송했습니다')}><Bell/> 전체 예약자 운영 안내</button><div className="filter-row">{['전체','승인 대기','승인 완료','탑승 준비','탑승 중','취소'].map(x=><button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{x}</button>)}</div><div className="reservation-list">{list.map(r=><article key={r.id} className={r.shared?'shared-reservation':''}><div className="reservation-head"><span>{r.time}</span><Status tone={r.state==='승인 대기'||r.state==='취소'?'warn':'normal'}>{r.state}</Status></div><b>{r.name} · {r.type} · {r.people}명</b><small>{r.id} · {r.support}</small><label>보트 배정<select value={r.boat} onChange={e=>update(r.id,{boat:e.target.value})}><option>미배정</option><option>MB-01</option><option>MB-02</option><option>MB-03</option><option>UB-01</option></select></label><div className="reservation-actions four"><button onClick={()=>r.state==='승인 대기'?approve(r):board(r)}>{r.state==='승인 대기'?'예약 승인':'탑승 승인'}</button><button onClick={()=>notify(`${r.id} 이용자에게 안내 문자를 보냈습니다`)}>안내</button><button onClick={()=>notify(`${r.id} 지원 요청을 확인했습니다`)}>지원</button><button className="danger" onClick={()=>{update(r.id,{state:'취소'});notify(`${r.id} 예약을 취소 처리했습니다`)}}>취소</button></div></article>)}</div></>
}

function OperationsPanel({notify}) {
  const [types,setTypes]=useState([
    {name:'문보트',capacity:2,enabled:true,accessible:true,count:3},
    {name:'별보트',capacity:2,enabled:true,accessible:false,count:2},
    {name:'UFO 보트',capacity:2,enabled:true,accessible:false,count:1},
  ])
  const [slots,setSlots]=useState(['18:30','19:30','20:30'])
  const [buffer,setBuffer]=useState('15')
  const [battery,setBattery]=useState('20')
  const [weather,setWeather]=useState(true)
  const changeType=(i,patch)=>setTypes(v=>v.map((x,j)=>j===i?{...x,...patch}:x))
  return <><h3 className="panel-section-title">보트 유형 및 정원</h3>{types.map((type,i)=><article className="type-setting" key={type.name}><div><b>{type.name}</b><small>운영 {type.count}척 · 최대 {type.capacity}명</small></div><label className="mini-toggle"><input type="checkbox" checked={type.enabled} onChange={e=>changeType(i,{enabled:e.target.checked})}/><i/></label><div className="type-options"><label>정원<select value={type.capacity} onChange={e=>changeType(i,{capacity:Number(e.target.value)})}><option value="1">1명</option><option value="2">2명</option><option value="3">3명</option><option value="4">4명</option></select></label><label className="compact-check"><input type="checkbox" checked={type.accessible} onChange={e=>changeType(i,{accessible:e.target.checked})}/> 휠체어 탑승 가능</label></div></article>)}<button className="ghost-wide" onClick={()=>notify('새 보트 유형 등록 화면을 열었습니다')}><Plus/> 보트 유형 추가</button><h3 className="panel-section-title">예약 회차</h3><div className="slot-list">{slots.map(x=><button key={x} onClick={()=>setSlots(v=>v.filter(s=>s!==x))}>{x}<X/></button>)}<button className="add-slot" onClick={()=>setSlots(v=>v.includes('21:30')?v:[...v,'21:30'])}><Plus/> 회차 추가</button></div><div className="admin-form-grid"><label>회차 간 정비시간<select value={buffer} onChange={e=>setBuffer(e.target.value)}><option value="10">10분</option><option value="15">15분</option><option value="20">20분</option><option value="30">30분</option></select></label><label>배터리 경고 기준<input type="number" value={battery} onChange={e=>setBattery(e.target.value)}/><span>%</span></label></div><h3 className="panel-section-title">운항 정책</h3><Toggle label="기상특보 시 신규 예약 중지" desc="운영자가 해제할 때까지 사용자 예약을 막습니다." checked={weather} onChange={setWeather}/><button className="accent-action" onClick={()=>notify('운영 설정을 저장했습니다')}><Check/> 설정 저장</button></>
}

function SystemPanel({notify}) { return <>{[['GPS 수신기','정상'],['SMS 발송 서비스','정상'],['콘텐츠 저장소','정상'],['MB-03 배터리 센서','주의']].map(([x,s])=><div className="system-row" key={x}><span className={s==='정상'?'ok':'warn'} /><div><b>{x}</b><small>마지막 확인 방금 전</small></div><em>{s}</em></div>)}<button className="accent-action" onClick={()=>notify('전체 시스템 점검을 시작했습니다')}><Gear /> 전체 연결 점검</button></> }

export default App
