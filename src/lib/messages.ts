import type { Language } from "./language";

// English source messages are stable keys, including existing server feedback.
// Keep UI copy here; fixture IDs, URLs and domain models stay language-neutral.
export const thaiMessages: Record<string, string> = {
  "Real Bangkok search, with sample exploration features.": "ค้นหาสถานที่จริงในกรุงเทพฯ พร้อมฟีเจอร์สำรวจที่ยังใช้ข้อมูลตัวอย่าง",
  "Retry search": "ค้นหาอีกครั้ง",
  "© OpenStreetMap contributors": "© ผู้ร่วมจัดทำ OpenStreetMap",
  "Search locations in Bangkok": "ค้นหาสถานที่ในกรุงเทพฯ",
  "Locations": "สถานที่",
  "Search places and addresses in Bangkok.": "ค้นหาสถานที่และที่อยู่ในกรุงเทพฯ",
  "Type at least 2 characters to search.": "พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา",
  "Searching Bangkok…": "กำลังค้นหาในกรุงเทพฯ…",
  "Search is unavailable. Please try again.": "ไม่สามารถค้นหาได้ในขณะนี้ โปรดลองอีกครั้ง",
  "No locations found. Try another name or address in Bangkok.": "ไม่พบสถานที่ ลองใช้ชื่อหรือที่อยู่อื่นในกรุงเทพฯ",
  "Location search by Geoapify": "ข้อมูลการค้นหาสถานที่จาก Geoapify",
  "Choose a location": "เลือกสถานที่",
  "This location link is incomplete or invalid. Search for a location to continue.": "ลิงก์สถานที่นี้มีข้อมูลไม่ครบหรือไม่ถูกต้อง ค้นหาสถานที่เพื่อสำรวจต่อ",
  "Flood data and official area boundaries are not available yet. This does not indicate safety.": "ยังไม่มีข้อมูลน้ำท่วมและขอบเขตพื้นที่ทางการ การไม่มีข้อมูลไม่ได้หมายความว่าปลอดภัย",
  "Nearby places and journeys are not available for this location yet.": "ยังไม่มีข้อมูลสถานที่ใกล้เคียงและการเดินทางสำหรับสถานที่นี้",
  "Map unavailable. You can still read the location details.": "แผนที่ไม่พร้อมใช้งาน คุณยังอ่านรายละเอียดสถานที่ได้",
  "Illustrative route · Not for navigation":
    "เส้นทางตัวอย่าง · ไม่ใช่ข้อมูลนำทาง",
  "Everyday picks": "สถานที่ในชีวิตประจำวัน",
  "Registration is temporarily unavailable. Please try again later.":
    "การลงทะเบียนไม่พร้อมใช้งานชั่วคราว โปรดลองอีกครั้งภายหลัง",
  "We couldn’t establish your session. Please try signing in again.":
    "ไม่สามารถเริ่มการใช้งานบัญชีได้ โปรดเข้าสู่ระบบอีกครั้ง",
  "This save request has expired or was cancelled. Return to Explore to save the place.":
    "คำขอบันทึกหมดอายุหรือถูกยกเลิก กลับไปสำรวจเพื่อบันทึกสถานที่",
  "We couldn’t verify your account. Sign in again to finish saving.":
    "ไม่สามารถตรวจสอบบัญชีได้ เข้าสู่ระบบอีกครั้งเพื่อบันทึกให้เสร็จ",
  "Your account changed. Check your account and sign in again to finish saving.":
    "บัญชีของคุณเปลี่ยนไป ตรวจสอบบัญชีและเข้าสู่ระบบอีกครั้งเพื่อบันทึกให้เสร็จ",
  "You’re signed in, but we couldn’t save the place. Please retry.":
    "เข้าสู่ระบบแล้ว แต่ยังบันทึกสถานที่ไม่ได้ โปรดลองอีกครั้ง",
  "We couldn’t confirm the save. Please retry; this won’t create a duplicate.":
    "ยังยืนยันการบันทึกไม่ได้ โปรดลองอีกครั้ง โดยจะไม่สร้างรายการซ้ำ",
  "Account services are unavailable. You can still explore; please try saving later.":
    "บริการบัญชีไม่พร้อมใช้งาน คุณยังสำรวจได้ โปรดลองบันทึกภายหลัง",
  "Your account changed. Saved places have been reloaded; please try again.":
    "บัญชีของคุณเปลี่ยนไป โหลดสถานที่ที่บันทึกใหม่แล้ว โปรดลองอีกครั้ง",
  "We couldn’t confirm your change. Please retry or reload saved places.":
    "ยังยืนยันการเปลี่ยนแปลงไม่ได้ โปรดลองอีกครั้งหรือโหลดสถานที่ที่บันทึกใหม่",
  Food: "อาหาร",
  "A sample street-level connection for shorter everyday trips.":
    "ตัวอย่างป้ายรถโดยสารสำหรับการเดินทางระยะสั้นในแต่ละวัน",
  "A sample bus connection near the entrance to the neighbourhood.":
    "ตัวอย่างจุดต่อรถโดยสารใกล้ทางเข้าย่าน",
  "A sample street-level connection along the main road.":
    "ตัวอย่างจุดต่อรถโดยสารริมถนนสายหลัก",
  "A sample place for after-school classes and neighbourhood learning.":
    "ตัวอย่างสถานที่เรียนหลังเลิกเรียนและแหล่งเรียนรู้ในย่าน",
  "A rail connection for the everyday commute along the Sukhumvit line.":
    "จุดเชื่อมต่อรถไฟฟ้าสำหรับการเดินทางประจำวันตามแนวสายสุขุมวิท",
  "A sample office tucked along a quieter side street.":
    "ตัวอย่างสำนักงานในซอยที่เงียบกว่าถนนหลัก",
  "A sample residential reference point, a short walk from the main road.":
    "ตัวอย่างจุดอ้างอิงที่พักอาศัย เดินไม่ไกลจากถนนหลัก",
  "Coffee, a simple breakfast, and a place to pause before work.":
    "กาแฟ อาหารเช้าง่าย ๆ และที่แวะพักก่อนเริ่มงาน",
  "A casual neighbourhood lunch stop on the way home.":
    "ร้านอาหารกลางวันสบาย ๆ ในย่าน ระหว่างทางกลับบ้าน",
  "Groceries and small everyday errands close to the station.":
    "ของสดและธุระเล็ก ๆ ในชีวิตประจำวันใกล้สถานี",
  "A sample primary-care stop for routine neighbourhood needs.":
    "ตัวอย่างสถานพยาบาลเบื้องต้นสำหรับคนในย่าน",
  "A local learning space for after-school and weekend classes.":
    "พื้นที่เรียนรู้ในย่านสำหรับชั้นเรียนหลังเลิกเรียนและวันหยุด",
  "A small green pause away from the busier main street.":
    "พื้นที่สีเขียวเล็ก ๆ สำหรับพักจากถนนสายหลักที่พลุกพล่าน",
  "A small cultural stop to explore on a free afternoon.":
    "พื้นที่ศิลปวัฒนธรรมเล็ก ๆ สำหรับสำรวจในช่วงบ่ายที่ว่าง",
  "An easy reference point for a rail-based daily commute.":
    "จุดอ้างอิงสำหรับการเดินทางด้วยรถไฟฟ้าในแต่ละวัน",
  "A sample workspace just off the main neighbourhood street.":
    "ตัวอย่างที่ทำงานใกล้ถนนหลักของย่าน",
  "A sample home base on a residential side street.":
    "ตัวอย่างที่พักในซอยที่พักอาศัย",
  "Coffee and breakfast along the route to the station.":
    "กาแฟและอาหารเช้าระหว่างทางไปสถานี",
  "A casual dinner option a few side streets from the main road.":
    "ร้านอาหารเย็นบรรยากาศสบายในซอยใกล้ถนนหลัก",
  "A compact grocery stop for everyday shopping.":
    "ร้านของชำขนาดเล็กสำหรับซื้อของใช้ประจำวัน",
  "Routine care close to the local shopping streets.":
    "บริการดูแลสุขภาพทั่วไปใกล้ถนนค้าขายในย่าน",
  "A sample language and evening learning centre.":
    "ตัวอย่างศูนย์เรียนภาษาและชั้นเรียนภาคค่ำ",
  "A quiet green courtyard for a short outdoor break.":
    "ลานสีเขียวเงียบ ๆ สำหรับพักกลางแจ้ง",
  "A small exhibition space for a weekend wander.":
    "พื้นที่นิทรรศการเล็ก ๆ สำหรับเดินชมในวันหยุด",
  "A university reference point for exploring a study-day routine.":
    "จุดอ้างอิงมหาวิทยาลัยสำหรับสำรวจชีวิตในวันเรียน",
  "A sample residence near the campus corridor.":
    "ตัวอย่างที่พักใกล้แนวถนนมหาวิทยาลัย",
  "A sample workplace along the local neighbourhood corridor.":
    "ตัวอย่างที่ทำงานตามแนวถนนในย่าน",
  "An everyday lunch stop around the university.":
    "ร้านอาหารกลางวันในชีวิตประจำวันรอบมหาวิทยาลัย",
  "A calm spot for coffee between study sessions.":
    "มุมเงียบ ๆ สำหรับดื่มกาแฟระหว่างพักเรียน",
  "A sample local bus connection; schedules are not available.":
    "ตัวอย่างจุดต่อรถโดยสารในพื้นที่ ไม่มีข้อมูลตารางเดินรถ",
  "A sample market stop for groceries and prepared food.":
    "ตัวอย่างตลาดสำหรับซื้อของสดและอาหารปรุงสำเร็จ",
  "A local primary-care example close to the campus.":
    "ตัวอย่างสถานพยาบาลเบื้องต้นใกล้มหาวิทยาลัย",
  "A green space for an outdoor break after class.":
    "พื้นที่สีเขียวสำหรับพักกลางแจ้งหลังเลิกเรียน",
  "A sample cultural stop along the older neighbourhood streets.":
    "ตัวอย่างพื้นที่วัฒนธรรมในย่านเก่า",
  "A central rail connection for a workday in Silom.":
    "จุดเชื่อมต่อรถไฟฟ้าสำหรับวันทำงานในสีลม",
  "A sample workplace just off Silom Road.": "ตัวอย่างที่ทำงานใกล้ถนนสีลม",
  "A straightforward lunch stop between work and errands.":
    "ร้านอาหารกลางวันระหว่างทำงานและทำธุระ",
  "Groceries and small daily essentials along the main road.":
    "ของสดและของใช้จำเป็นประจำวันริมถนนหลัก",
  "A sample clinic for routine care in the neighbourhood.":
    "ตัวอย่างคลินิกสำหรับดูแลสุขภาพทั่วไปในย่าน",
  "Classes for a study routine near the office district.":
    "ชั้นเรียนใกล้ย่านสำนักงาน",
  "A small outdoor break tucked away from the main road.":
    "พื้นที่พักกลางแจ้งเล็ก ๆ ห่างจากถนนหลัก",
  "A small exhibition stop beyond the daily commute.":
    "พื้นที่นิทรรศการเล็ก ๆ ให้แวะชมนอกเวลาเดินทางประจำวัน",
  Prototype: "ข้อมูลตัวอย่าง",
  "· Bangkok": "· กรุงเทพฯ",
  "Show map": "ดูแผนที่",
  "Show details": "ดูข้อมูล",
  Home: "หน้าแรก",
  Explore: "สำรวจ",
  Saved: "บันทึกไว้",
  Account: "บัญชี",
  "Skip to content": "ข้ามไปเนื้อหา",
  "YAAN home": "หน้าแรก YAAN",
  "Every place has a story.": "ทุกย่านมีเรื่องราว",
  "Primary navigation": "เมนูหลัก",
  Bangkok: "กรุงเทพฯ",
  "Switch to light mode": "เปลี่ยนเป็นโหมดสว่าง",
  "Switch to dark mode": "เปลี่ยนเป็นโหมดมืด",
  "Change language to English": "เปลี่ยนเป็นภาษาอังกฤษ",
  "A little context. A better sense of place.":
    "รู้จักพื้นที่ เข้าใจย่านที่คุณสนใจ",
  "A place is more": "ทุกสถานที่",
  "than an": "มีมากกว่า",
  "address.": "แค่ที่อยู่",
  "Get to know life around a location. Find everyday places, see how far they are, and understand the area’s history.":
    "รู้จักย่านรอบสถานที่ที่คุณสนใจ ค้นหาสถานที่ที่ใช้ในทุกวัน ดูระยะทาง และประวัติของพื้นที่",
  "Where would you like to explore?": "อยากรู้จักย่านไหน?",
  "A starting point": "เริ่มต้นที่นี่",
  "Try a neighbourhood.": "ลองสำรวจสักย่าน",
  "Choose an area, then find your place in it.":
    "เลือกย่าน แล้วค้นหาสถานที่ที่คุณสนใจ",
  "Start with a station, home or workspace.": "เริ่มจากสถานี บ้าน หรือที่ทำงาน",
  "Look around a place along Sukhumvit.":
    "สำรวจรอบสถานที่บนถนนสุขุมวิท",
  "Explore everyday life around a campus.": "สำรวจชีวิตประจำวันรอบมหาวิทยาลัย",
  "Sample places and context, ready to explore.":
    "ลองสำรวจสถานที่และบริบทจากข้อมูลตัวอย่าง",
  "Beyond the address": "มากกว่าที่อยู่",
  "Picture your everyday.": "เห็นภาพชีวิตในแต่ละวัน",
  "Whether it’s somewhere new or the place you already call home.":
    "ไม่ว่าจะเป็นย่านใหม่ หรือย่านที่คุณเรียกว่าบ้าน",
  "The things you need": "สิ่งจำเป็นในแต่ละวัน",
  "Food, transport, parks and everyday essentials around your reference location.":
    "อาหาร การเดินทาง สวน และสิ่งจำเป็นรอบจุดอ้างอิงของคุณ",
  "A sense of distance": "เข้าใจระยะทาง",
  "Approximate travel times and route previews to put nearby places in perspective.":
    "ดูเวลาเดินทางโดยประมาณและตัวอย่างเส้นทาง เพื่อเข้าใจว่าสถานที่ใกล้เคียงอยู่ไกลแค่ไหน",
  "The area’s story": "เรื่องราวของพื้นที่",
  "Look at historical flood reports, with the context and limitations kept in view.":
    "ดูตัวอย่างประวัติน้ำท่วม พร้อมบริบทและข้อจำกัดของข้อมูล",
  "Open Explore": "เริ่มสำรวจ",
  "YAAN means neighbourhood.": "YAAN คือ “ย่าน” ที่คุณอยากรู้จัก",
  "A working prototype with sample data.": "ทดลองสำรวจด้วยข้อมูลตัวอย่าง",
  "Explore freely. No sign-in needed.": "สำรวจได้เลย โดยไม่ต้องเข้าสู่ระบบ",
  "Try Ari, Thong Lo or Lat Krabang. Sample locations only.":
    "ลองพิมพ์อารีย์ ทองหล่อ หรือลาดกระบัง · ข้อมูลตัวอย่าง",
  "Search demo locations in Bangkok": "ค้นหาสถานที่ตัวอย่างในกรุงเทพฯ",
  "Find an area or a place": "ค้นหาย่านหรือสถานที่",
  "Clear search": "ล้างคำค้นหา",
  "Areas & places": "ย่านและสถานที่",
  "Demo locations": "สถานที่ตัวอย่าง",
  "No demo places match. Try Ari, Thong Lo, or Lat Krabang.":
    "ไม่พบสถานที่ตัวอย่าง ลองค้นหาอารีย์ ทองหล่อ หรือลาดกระบัง",
  "Sample locations · Search stays on this device":
    "สถานที่ตัวอย่าง · คำค้นหาอยู่ในอุปกรณ์นี้เท่านั้น",
  Area: "ย่าน",
  "Nearby place category": "ประเภทสถานที่ใกล้เคียง",
  Essentials: "สิ่งจำเป็น",
  "Food & drink": "อาหารและเครื่องดื่ม",
  Transport: "การเดินทาง",
  Shopping: "ซื้อของ",
  Health: "สุขภาพ",
  Education: "การศึกษา",
  Parks: "สวน",
  Attractions: "สถานที่น่าสนใจ",
  Office: "ที่ทำงาน",
  Residence: "ที่พักอาศัย",
  "Finding our bearings…": "กำลังเตรียมแผนที่…",
  "Skip to location details": "ข้ามไปข้อมูลสถานที่",
  "Area context": "บริบทพื้นที่",
  "Flood history": "ประวัติน้ำท่วม",
  "Explore Bangkok neighbourhoods": "สำรวจย่านในกรุงเทพฯ",
  "One part of the bigger picture": "ส่วนหนึ่งของภาพรวม",
  "A closer look at Bangkok": "รู้จักกรุงเทพฯ ให้มากขึ้น",
  "Where will your day begin?": "แต่ละวันของคุณเริ่มที่ไหน?",
  "Context, not a prediction.": "ข้อมูลประกอบ ไม่ใช่การคาดการณ์",
  "Choose a place to explore around.": "เลือกสถานที่เพื่อสำรวจรอบ ๆ",
  "Illustrative area": "ขอบเขตพื้นที่ตัวอย่าง",
  "Mock reports": "รายงานตัวอย่าง",
  "Clear route preview": "ล้างตัวอย่างเส้นทาง",
  Clear: "ล้าง",
  "Your reference": "จุดอ้างอิงของคุณ",
  "Sample places": "สถานที่ตัวอย่าง",
  "Mock walking route": "เส้นทางเดินตัวอย่าง",
  "Everyday places": "สถานที่ในชีวิตประจำวัน",
  "Places, journeys & area context · All sample data":
    "สถานที่ การเดินทาง และบริบทพื้นที่ · ใช้ข้อมูลตัวอย่างทั้งหมด",
  "Mock flood context.": "บริบทน้ำท่วมจากข้อมูลตัวอย่าง",
  "Collapse location details": "ย่อข้อมูลเพื่อดูแผนที่",
  "Expand location details": "ขยายข้อมูลสถานที่",
  "Your reference location": "จุดอ้างอิงของคุณ",
  "Explore a neighbourhood": "สำรวจย่าน",
  "Mock data": "ข้อมูลตัวอย่าง",
  "Exploring from here": "สำรวจจากจุดนี้",
  Change: "เปลี่ยน",
  "Pick a place on the map or below.": "เลือกสถานที่บนแผนที่หรือรายการด้านล่าง",
  "Choose a starting point in Places.": "เลือกจุดเริ่มต้นในแท็บสถานที่",
  "Location context": "ข้อมูลรอบสถานที่",
  Nearby: "ใกล้เคียง",
  Places: "สถานที่",
  "Back to nearby": "กลับไปดูสถานที่ใกล้เคียง",
  "Back to area": "กลับไปที่ย่าน",
  "Sample place": "สถานที่ตัวอย่าง",
  "Walking route": "เส้นทางเดิน",
  Destination: "ปลายทาง",
  "min walk": "นาที เดิน",
  "min drive": "นาที ขับรถ",
  min: "นาที",
  "Sample route": "เส้นทางตัวอย่าง",
  "Illustrative · No traffic data": "เวลาโดยประมาณ · ไม่มีข้อมูลจราจร",
  "Walking route preview": "ตัวอย่างเส้นทางเดิน",
  "Clear route": "ล้างเส้นทาง",
  Directions: "ดูเส้นทาง",
  "Mock route and approximate times. Paths and access are unverified; this preview is not navigation guidance.":
    "เส้นทางตัวอย่างและเวลาโดยประมาณ ยังไม่ได้ตรวจสอบเส้นทางหรือการเข้าถึง ไม่ควรใช้สำหรับนำทางจริง",
  "Explore around this place": "สำรวจรอบสถานที่นี้",
  "You’re exploring around this place.": "คุณกำลังสำรวจรอบสถานที่นี้",
  "Nearby everyday places": "สถานที่ในชีวิตประจำวันใกล้เคียง",
  "Choose a reference location": "เลือกจุดอ้างอิง",
  "Your everyday surroundings": "รอบตัวคุณในทุกวัน",
  "Start with a place": "เริ่มจากสถานที่",
  "A few useful places, measured from your starting point.":
    "สถานที่ใกล้เคียง พร้อมระยะทางจากจุดเริ่มต้นของคุณ",
  "Choose a station, workplace, home, or campus as your reference.":
    "เลือกสถานี ที่ทำงาน บ้าน หรือมหาวิทยาลัยเป็นจุดอ้างอิง",
  "No other places in this sample category. Try another category; this is not a complete directory.":
    "ไม่มีสถานที่อื่นในหมวดตัวอย่างนี้ ลองเลือกหมวดอื่น ข้อมูลนี้ไม่ได้ครอบคลุมทุกสถานที่",
  "Distances and times follow illustrative routes. Sample places only.":
    "ระยะทางและเวลาคำนวณจากเส้นทางตัวอย่าง ใช้ข้อมูลสถานที่ตัวอย่างเท่านั้น",
  "These are sample locations, not listings or recommendations.":
    "สถานที่เหล่านี้เป็นตัวอย่าง ไม่ใช่รายการประกาศหรือคำแนะนำ",
  "Flood overview": "ภาพรวมน้ำท่วม",
  "Behind the summary": "รายละเอียดประกอบ",
  "A closer look at the fictional reports shown on the map.":
    "ดูรายละเอียดรายงานสมมติที่แสดงบนแผนที่",
  "Every report below is invented. The risk category is a sample label, not a calculated assessment.":
    "รายงานด้านล่างทั้งหมดเป็นข้อมูลสมมติ ระดับความเสี่ยงเป็นเพียงป้ายตัวอย่าง ไม่ใช่ผลการประเมิน",
  "Sample reports": "รายงานตัวอย่าง",
  "Mock report": "รายงานตัวอย่าง",
  "No reports in this sample. This is an absence of information, not evidence of low risk.":
    "ไม่มีรายงานในข้อมูลตัวอย่างนี้ การขาดข้อมูลไม่ได้หมายความว่ามีความเสี่ยงต่ำ",
  "The shaded shape only illustrates a surrounding area. It is not a flood extent or a validated analysis boundary. Historical information cannot guarantee future conditions at a building.":
    "พื้นที่แรเงาเป็นเพียงตัวอย่างพื้นที่โดยรอบ ไม่ใช่ขอบเขตน้ำท่วมหรือขอบเขตวิเคราะห์ที่ผ่านการตรวจสอบ ข้อมูลในอดีตไม่อาจยืนยันสภาพอาคารในอนาคต",
  "Illustrative flood risk": "ระดับความเสี่ยงน้ำท่วมตัวอย่าง",
  "Area-level example · Not a forecast":
    "ตัวอย่างระดับพื้นที่ · ไม่ใช่การพยากรณ์",
  "Historical reports": "รายงานในอดีต",
  "mock reports": "รายงานตัวอย่าง",
  "In the illustrated area": "ในพื้นที่ตัวอย่าง",
  "Common months": "เดือนที่พบบ่อย",
  "Not available": "ไม่มีข้อมูล",
  "In this sample history": "ในประวัติตัวอย่างนี้",
  "No sample history": "ไม่มีประวัติตัวอย่าง",
  "Monthly distribution of fictional reports": "จำนวนรายงานสมมติแยกตามเดือน",
  "A little seasonal context": "บริบทตามฤดูกาล",
  "2022–2024 · Sample": "2022–2024 · ข้อมูลตัวอย่าง",
  "More sample reports in": "รายงานตัวอย่างพบมากใน",
  "There is not enough information to show a pattern.":
    "ข้อมูลไม่เพียงพอที่จะแสดงรูปแบบ",
  "Explore flood history": "ดูประวัติน้ำท่วม",
  "Get to know the area, not predict the future. These examples are not a real flood assessment.":
    "ใช้เพื่อรู้จักพื้นที่ ไม่ใช่ทำนายอนาคต ข้อมูลตัวอย่างนี้ไม่ใช่การประเมินน้ำท่วมจริง",
  "Moderate flood risk": "ความเสี่ยงน้ำท่วมปานกลาง",
  "Insufficient information": "ข้อมูลไม่เพียงพอ",
  "This sample has no flood records for the area. Missing information is not evidence of low risk.":
    "ตัวอย่างนี้ไม่มีบันทึกน้ำท่วมในพื้นที่ การขาดข้อมูลไม่ได้หมายความว่ามีความเสี่ยงต่ำ",
  "In this example, nearby streets have occasional flood reports, mostly during the wetter months.":
    "ในตัวอย่างนี้ ถนนใกล้เคียงมีรายงานน้ำท่วมเป็นครั้งคราว โดยส่วนใหญ่อยู่ในช่วงฝนตกชุก",
  "This fictional example shows a few nearby street-flooding reports. It does not describe current conditions.":
    "ตัวอย่างสมมตินี้แสดงรายงานน้ำท่วมถนนใกล้เคียงบางส่วน ไม่ได้สะท้อนสถานการณ์ปัจจุบัน",
  "This example has no report data. Missing reports do not mean an area is safe from flooding.":
    "ตัวอย่างนี้ไม่มีข้อมูลรายงาน การไม่มีรายงานไม่ได้หมายความว่าพื้นที่ปลอดภัยจากน้ำท่วม",
  "Getting the neighbourhood ready…": "กำลังเตรียมข้อมูลย่าน…",
  "Map unavailable. You can still explore the sample overview.":
    "แผนที่ไม่พร้อมใช้งาน คุณยังดูข้อมูลตัวอย่างในแผงข้อมูลได้",
  "Retry map": "โหลดแผนที่อีกครั้ง",
  "Map controls": "เครื่องมือแผนที่",
  North: "ทิศเหนือ",
  "Zoom in": "ขยายแผนที่",
  "Zoom out": "ย่อแผนที่",
  "Fictional report": "รายงานสมมติ",
  "Your places": "สถานที่ของคุณ",
  "· Your account": "· บัญชีของคุณ",
  "Saved places": "สถานที่ที่บันทึก",
  "A few places to come back to.": "เก็บสถานที่ที่อยากกลับมาดูอีกครั้ง",
  "Saved places are unavailable.": "ไม่สามารถเปิดสถานที่ที่บันทึกได้",
  "Loading saved places…": "กำลังโหลดสถานที่ที่บันทึก…",
  "Saved to your account. Available whenever you sign in.":
    "บันทึกไว้ในบัญชี เปิดดูได้ทุกครั้งที่เข้าสู่ระบบ",
  "Sign in to access your saved places.": "เข้าสู่ระบบเพื่อดูสถานที่ที่บันทึก",
  "Keep your places together.": "รวมสถานที่ที่คุณสนใจไว้ด้วยกัน",
  "Sign in or create an account to save places and find them again on any device.":
    "เข้าสู่ระบบหรือสร้างบัญชีเพื่อบันทึกสถานที่ แล้วกลับมาดูได้จากทุกอุปกรณ์",
  "Sign in or create account": "เข้าสู่ระบบหรือสร้างบัญชี",
  "Continue exploring": "สำรวจต่อ",
  "Continue exploring →": "สำรวจต่อ →",
  "Try again": "ลองอีกครั้ง",
  place: "สถานที่",
  places: "สถานที่",
  "Sample locations": "สถานที่ตัวอย่าง",
  Unsave: "เลิกบันทึก",
  "Keep exploring": "สำรวจต่อ",
  "Keep a place in mind.": "เก็บสถานที่ที่คุณสนใจ",
  "Save a place from its details in Explore. It will appear here when you want another look.":
    "บันทึกสถานที่จากหน้ารายละเอียดในสำรวจ แล้วกลับมาดูที่นี่ได้เมื่อต้องการ",
  "Explore a location": "สำรวจสถานที่",
  "Updating saved places…": "กำลังอัปเดตสถานที่ที่บันทึก…",
  "Opening sign in…": "กำลังเปิดหน้าเข้าสู่ระบบ…",
  "Sign in to save": "เข้าสู่ระบบเพื่อบันทึก",
  "Save unavailable": "ไม่สามารถบันทึกได้",
  "Checking…": "กำลังตรวจสอบ…",
  "Removing…": "กำลังนำออก…",
  "Saving…": "กำลังบันทึก…",
  Save: "บันทึก",
  "Opening sign in to save this place.":
    "กำลังเปิดหน้าเข้าสู่ระบบเพื่อบันทึกสถานที่นี้",
  "Reload saved state": "ตรวจสอบการบันทึกอีกครั้ง",
  "Your YAAN": "YAAN ของคุณ",
  "Keep useful places together, ready for another look.":
    "เก็บสถานที่ที่สนใจไว้ เพื่อกลับมาดูได้อีกครั้ง",
  "Saved Places belongs to your account. You can explore without signing in.":
    "สถานที่ที่บันทึกจะอยู่ในบัญชีของคุณ คุณสำรวจได้โดยไม่ต้องเข้าสู่ระบบ",
  "Account access": "การเข้าใช้บัญชี",
  "Sign in or create an account": "เข้าสู่ระบบหรือสร้างบัญชี",
  "Sign in": "เข้าสู่ระบบ",
  "Create account": "สร้างบัญชี",
  "Check your email": "ตรวจสอบอีเมลของคุณ",
  "Open the link in this browser.": "เปิดลิงก์ในเบราว์เซอร์นี้",
  "We’ll save your place and return you to Explore. If you confirm elsewhere, come back here and sign in to finish saving.":
    "เราจะบันทึกสถานที่และพาคุณกลับไปสำรวจ หากยืนยันในเบราว์เซอร์อื่น ให้กลับมาเข้าสู่ระบบที่นี่เพื่อบันทึกให้เสร็จ",
  "Then you can continue using your account.": "จากนั้นคุณจะใช้งานบัญชีต่อได้",
  "Already registered? Use Sign in. If no email arrives, check your spam folder and try again later.":
    "มีบัญชีอยู่แล้ว? เลือกเข้าสู่ระบบ หากไม่ได้รับอีเมล ให้ตรวจสอบโฟลเดอร์สแปมแล้วลองอีกครั้งภายหลัง",
  Email: "อีเมล",
  Password: "รหัสผ่าน",
  "Use at least 8 characters. A longer, unique password is best.":
    "ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร ควรตั้งให้ยาวและไม่ซ้ำกับบัญชีอื่น",
  "Creating account…": "กำลังสร้างบัญชี…",
  "Signing in…": "กำลังเข้าสู่ระบบ…",
  "Please wait while we process your request.": "โปรดรอสักครู่ระหว่างดำเนินการ",
  "You’re signed in, but we couldn’t save the place. Retry to finish and return to Explore.":
    "เข้าสู่ระบบแล้ว แต่ยังบันทึกสถานที่ไม่ได้ ลองอีกครั้งเพื่อบันทึกและกลับไปสำรวจ",
  "Saving and returning…": "กำลังบันทึกและกลับไปสำรวจ…",
  "Retry save and return": "บันทึกอีกครั้งและกลับไปสำรวจ",
  "Saving your place…": "กำลังบันทึกสถานที่ของคุณ…",
  "Check account and sign in again": "ตรวจสอบบัญชีและเข้าสู่ระบบอีกครั้ง",
  "Returning…": "กำลังกลับ…",
  "Return without saving": "กลับโดยไม่บันทึก",
  "Signing out…": "กำลังออกจากระบบ…",
  "Sign out": "ออกจากระบบ",
  "Checking your account…": "กำลังตรวจสอบบัญชี…",
  "Account services are temporarily unavailable.":
    "บริการบัญชีไม่พร้อมใช้งานชั่วคราว",
  "Account access is unavailable. You can still explore; saving requires an account.":
    "บริการบัญชีไม่พร้อมใช้งาน คุณยังสำรวจได้ แต่การบันทึกต้องใช้บัญชี",
  "We couldn’t check your account. Please try again.":
    "ไม่สามารถตรวจสอบบัญชีได้ โปรดลองอีกครั้ง",
  "You’re signed in": "เข้าสู่ระบบแล้ว",
  "The save request has expired or was cancelled. Open the place in Explore to save it.":
    "คำขอบันทึกหมดอายุหรือถูกยกเลิก เปิดสถานที่ในสำรวจเพื่อบันทึกอีกครั้ง",
  "View Saved Places": "ดูสถานที่ที่บันทึก",
  "Sign in to keep places in your account and find them again on any device.":
    "เข้าสู่ระบบเพื่อเก็บสถานที่ไว้ในบัญชี แล้วกลับมาดูได้จากทุกอุปกรณ์",
  "The save request has expired or was cancelled. You can still sign in, then open the place in Explore.":
    "คำขอบันทึกหมดอายุหรือถูกยกเลิก คุณยังเข้าสู่ระบบได้ แล้วเปิดสถานที่ในสำรวจอีกครั้ง",
  "We couldn’t confirm that link. It may have expired or already been used. Try signing in if you’ve already confirmed, or sign up again to request another email.":
    "ไม่สามารถยืนยันลิงก์นี้ได้ ลิงก์อาจหมดอายุหรือถูกใช้แล้ว หากยืนยันอีเมลแล้วให้ลองเข้าสู่ระบบ หรือสมัครอีกครั้งเพื่อขออีเมลใหม่",
  "Your next chapter starts with a place.":
    "เรื่องราวบทใหม่ เริ่มจากย่านที่คุณเลือก",
  "Get to know the neighbourhood. Keep the places that matter to you.":
    "รู้จักย่านที่สนใจ เก็บสถานที่ที่มีความหมายกับคุณ",
  "The email or password is incorrect. Please try again.":
    "อีเมลหรือรหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง",
  "Confirm your email using the link in your inbox, then sign in.":
    "ยืนยันอีเมลด้วยลิงก์ในกล่องจดหมาย แล้วเข้าสู่ระบบ",
  "Unable to create this account. If you already registered, try signing in.":
    "ไม่สามารถสร้างบัญชีนี้ได้ หากลงทะเบียนแล้วให้ลองเข้าสู่ระบบ",
  "Choose a stronger password. Use at least 8 characters with upper and lowercase letters, numbers, and symbols.":
    "ตั้งรหัสผ่านที่คาดเดายากขึ้น ใช้อย่างน้อย 8 ตัวอักษร รวมตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และสัญลักษณ์",
  "Check your email address and password, then try again.":
    "ตรวจสอบอีเมลและรหัสผ่าน แล้วลองอีกครั้ง",
  "Too many attempts. Please wait a few minutes before trying again.":
    "มีการลองหลายครั้งเกินไป โปรดรอสักครู่แล้วลองอีกครั้ง",
  "Email registration is currently unavailable. Please try again later.":
    "ยังไม่สามารถลงทะเบียนด้วยอีเมลได้ โปรดลองอีกครั้งภายหลัง",
  "We couldn’t complete that request. Please try again shortly.":
    "ไม่สามารถดำเนินการได้ โปรดลองอีกครั้งในอีกสักครู่",
  "Choose sign in or sign up.": "เลือกเข้าสู่ระบบหรือสร้างบัญชี",
  "Enter a valid email address.": "กรอกอีเมลที่ถูกต้อง",
  "Enter a password of no more than 1024 characters.":
    "กรอกรหัสผ่านไม่เกิน 1024 ตัวอักษร",
  "Use at least 8 characters for your password.":
    "ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร",
  "Account access is not available yet.": "บริการบัญชียังไม่พร้อมใช้งาน",
  "We couldn’t reach account services. Please try again.":
    "ไม่สามารถเชื่อมต่อบริการบัญชีได้ โปรดลองอีกครั้ง",
  "We couldn’t sign you out. Please try again.":
    "ไม่สามารถออกจากระบบได้ โปรดลองอีกครั้ง",
  "Open the place in Explore and try saving again.":
    "เปิดสถานที่ในสำรวจ แล้วลองบันทึกอีกครั้ง",
  "We couldn’t start sign-in. Please try again.":
    "ไม่สามารถเปิดการเข้าสู่ระบบได้ โปรดลองอีกครั้ง",
  "We couldn’t load your saved places. Please try again.":
    "ไม่สามารถโหลดสถานที่ที่บันทึกได้ โปรดลองอีกครั้ง",
  "This place cannot be saved.": "ไม่สามารถบันทึกสถานที่นี้ได้",
  "Around {name}. Area-level evidence, not a building assessment.":
    "รอบ {name} ข้อมูลระดับพื้นที่ ไม่ใช่การประเมินรายอาคาร",
  "Exploring around {name}": "กำลังสำรวจรอบ {name}",
  "Explore {name}": "สำรวจ {name}",
  "Exploring {name}. Choose a reference place.":
    "กำลังสำรวจ {name} เลือกสถานที่เป็นจุดอ้างอิง",
  "{count} sample places.": "สถานที่ตัวอย่าง {count} แห่ง",
  "Route preview to {name}.": "ตัวอย่างเส้นทางไป {name}",
  "Sample route · ~{minutes} min walk":
    "เส้นทางตัวอย่าง · เดินประมาณ {minutes} นาที",
  "Reference location: {name}": "จุดอ้างอิง: {name}",
  "View sample report: {street}, {date}": "ดูรายงานตัวอย่าง: {street}, {date}",
  "Recenter on {name}": "กลับไปที่ {name}",
  "Bangkok map. Use arrow keys to pan and plus or minus to zoom.":
    "แผนที่กรุงเทพฯ ใช้ปุ่มลูกศรเลื่อนแผนที่ และปุ่มบวกหรือลบเพื่อขยายหรือย่อ",
  "Unsave {name}": "เลิกบันทึก {name}",
  "Save {name}": "บันทึก {name}",
  "Sign in to save {name}": "เข้าสู่ระบบเพื่อบันทึก {name}",
  "{name} removed from Saved Places.": "นำ {name} ออกจากสถานที่ที่บันทึกแล้ว",
  "{name} added to Saved Places.": "เพิ่ม {name} ในสถานที่ที่บันทึกแล้ว",
  "Save {name} and return to where you left off.":
    "บันทึก {name} แล้วกลับไปสำรวจต่อจากเดิม",
  "Sign in or create an account to save {name}. We’ll save it and return you to the same place in Explore.":
    "เข้าสู่ระบบหรือสร้างบัญชีเพื่อบันทึก {name} เราจะบันทึกแล้วพาคุณกลับไปจุดเดิมในสำรวจ",
  "If registration can proceed for {email}, you’ll receive a confirmation link. Open it to confirm your email. You are not signed in yet.":
    "หากลงทะเบียนด้วย {email} ได้ คุณจะได้รับลิงก์ยืนยัน เปิดลิงก์เพื่อยืนยันอีเมล ขณะนี้คุณยังไม่ได้เข้าสู่ระบบ",
  "{month}: {count} sample reports": "{month}: รายงานตัวอย่าง {count} รายการ",
  Jan: "ม.ค.",
  Feb: "ก.พ.",
  Mar: "มี.ค.",
  Apr: "เม.ย.",
  May: "พ.ค.",
  Jun: "มิ.ย.",
  Jul: "ก.ค.",
  Aug: "ส.ค.",
  Sep: "ก.ย.",
  Oct: "ต.ค.",
  Nov: "พ.ย.",
  Dec: "ธ.ค.",
};

const englishMessages: Record<string, string> = {
  Prototype: "Sample data",
  "Change language to English": "Switch language to Thai",
  "Mock data": "Sample data",
  "Mock reports": "Sample reports",
  "Mock report": "Sample report",
  "mock reports": "sample reports",
  "Mock walking route": "Sample walking route",
  "Mock flood context.": "Sample flood context.",
  "Search demo locations in Bangkok": "Search sample locations in Bangkok",
  "Demo locations": "Sample locations",
  "No demo places match. Try Ari, Thong Lo, or Lat Krabang.":
    "No sample places match. Try Ari, Thong Lo, or Lat Krabang.",
  "A working prototype with sample data.": "Explore with sample data.",
  "Mock route and approximate times. Paths and access are unverified; this preview is not navigation guidance.":
    "Sample route and approximate times. Paths and access are unverified; this preview is not navigation guidance.",
};
export type MessageValues = Record<string, string | number>;
export function translate(
  language: Language,
  message: string,
  values: MessageValues = {},
) {
  const copy =
    (language === "th" ? thaiMessages[message] : englishMessages[message]) ??
    message;
  return copy.replace(/\{(\w+)\}/g, (token, key: string) =>
    String(values[key] ?? token),
  );
}
// Stable functions prevent language-independent effects from rerunning.
export const translators = {
  th: (message: string, values?: MessageValues) =>
    translate("th", message, values),
  en: (message: string, values?: MessageValues) =>
    translate("en", message, values),
};
