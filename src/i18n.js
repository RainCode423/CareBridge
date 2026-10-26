/** SeniorCare user-interface localization. Source recipe/user content is not machine-translated. */
const STORAGE_KEY='seniorcare-language';
export const LANGUAGES=Object.freeze({en:'English',zh:'简体中文',es:'Español'});
const LOCALE={en:'en-US',zh:'zh-CN',es:'es-ES'};
let active='en';
try {const saved=localStorage.getItem(STORAGE_KEY);if(saved in LANGUAGES) active=saved;}catch(_){}
export const getLanguage=()=>active;
export const getLocale=()=>LOCALE[active];

/** en | Spanish | Simplified Chinese; UI-only, no personal data is sent anywhere. */
const rows=String.raw`
Today | Hoy | Hoy
My planner | Mi agenda | 我的日程
Care planner | Agenda de cuidados | 照护日程
Nearby | Cerca de mí | 附近地点
Recipes | Recetas | 食谱
Settings | Configuración | 设置
Family | Familia | 家人
Refresh | Actualizar | 刷新
Sign out | Cerrar sesión | 退出登录
SENIOR ACCOUNT | CUENTA DE PERSONA MAYOR | 长者账户
FAMILY ACCOUNT | CUENTA FAMILIAR | 家属账户
ACCOUNT SETUP | CONFIGURAR CUENTA | 设置账户
SECURE SIGN IN | INICIO DE SESIÓN SEGURO | 安全登录
SUPABASE CONNECTED APP | APLICACIÓN CONECTADA | 应用已连接
Senior Portal | Portal para mayores | 长者主页
SeniorCare support | Ayuda de SeniorCare | SeniorCare 帮助
What would help today? | ¿Qué ayuda necesita hoy? | 今天需要什么帮助？
Choose one option. | Elija una opción. | 请选择一项。
Call your family | Llamar a su familia | 请家人打电话
Help with errands | Ayuda con los mandados | 帮忙采购办事
Not feeling well | No me siento bien | 身体不舒服
Something else | Otra cosa | 其他帮助
Save help request | Enviar solicitud de ayuda | 发送求助请求
Cancel | Cancelar | 取消
Close | Cerrar | 关闭
How are you today? | ¿Cómo se siente hoy? | 今天感觉怎么样？
Check in or ask for help. | Confirme cómo está o pida ayuda. | 报个平安或请求帮助。
I'm okay today | Hoy estoy bien | 今天我很好
I could use help | Necesito ayuda | 我需要帮助
Today's check-in | Registro de hoy | 今日签到
Request answered | Solicitud atendida | 求助已回应
Your caregiver checked in. | Su cuidador respondió. | 家属已回应。
Your request was received. Need more help? Let them know. | Su solicitud fue recibida. Si necesita más ayuda, avise a su familia. | 家人已收到您的求助。如需更多帮助，请再次告知。
I still need help | Todavía necesito ayuda | 我还需要帮助
Help requested | Ayuda solicitada | 已请求帮助
Checked in | Registro completado | 已报平安
You’re checked in! | ¡Ha confirmado que está bien! | 已成功报平安！
Your request is saved. Your caregiver can see it when they open SeniorCare. | Su solicitud está guardada. Su familia podrá verla al abrir SeniorCare. | 求助请求已保存。家人打开 SeniorCare 后就能看到。
Update help request | Actualizar solicitud | 更新求助请求
Read this aloud | Leer en voz alta | 朗读此页
I need help instead | En realidad, necesito ayuda | 我需要帮助
How are you feeling? | ¿Cómo se siente? | 您感觉怎么样？
(optional) | (opcional) | （选填）
Good | Bien | 好
So-so | Regular | 一般
Not great | No muy bien | 不太好
Your care planner | Su agenda | 您的日程
Things to do today | Tareas de hoy | 今日待办
Tasks for today. | Sus tareas de hoy. | 今天的任务。
Open planner | Abrir agenda | 打开日程
Add a task | Añadir tarea | 添加任务
Reminders | Recordatorios | 提醒事项
Things to remember today. | Cosas para recordar hoy. | 今天需要记住的事。
A note to your family | Mensaje para su familia | 给家人的留言
Send a note to your family. | Escriba a su familia. | 给家人留个言。
Your message | Su mensaje | 留言内容
Save note for family | Guardar mensaje | 保存留言
Your last 7 days | Últimos 7 días | 过去七天
Your recent check-ins. | Sus registros recientes. | 最近的签到记录。
Checked in today | Registrado hoy | 今天已报平安
Help request | Solicitud de ayuda | 求助记录
No check-in | Sin registro | 未签到
A blank day means no check-in was recorded. | Un día vacío indica que no hubo registro. | 空白日期表示没有签到记录。
7-day check-in activity | Registros de los últimos 7 días | 过去七天签到情况
View the rhythm of daily check-ins. | Consulte los registros diarios. | 查看每天的签到情况。
Today’s status | Estado de hoy | 今日状态
Shared care planner | Agenda familiar compartida | 家庭共享日程
See all | Ver todo | 查看全部
At a glance | Resumen | 概览
Check-ins this week | Registros esta semana | 本周签到次数
Latest update | Última actualización | 最新动态
A check-in indicates a response, not a medical or safety assessment. | El registro confirma una respuesta, no una evaluación médica. | 签到仅表示用户已回应，并非健康评估。
What happens if a check-in is missed? | ¿Qué pasa si falta un registro? | 如果没有签到怎么办？
Automatic missed check-in alerts are not available yet. | Todavía no hay avisos automáticos por falta de registro. | 暂不支持自动未签到提醒。
Preview missed check-in | Vista previa de registro omitido | 预览未签到情况
Return to real demo state | Volver al estado real | 返回实际状态
Preview only — no messages are sent. | Solo es una demostración; no se envían mensajes. | 仅供预览，不会发送通知。
Family connection | Conexión familiar | 家庭联系
Call if you’re concerned. | Llame si está preocupado. | 如有担忧，请打电话。
Check how they’re doing. | Pregunte cómo se encuentra. | 关心一下他们的近况。
Only connected caregivers can view updates. | Solo familiares conectados pueden ver las novedades. | 只有已关联的家人可以查看动态。
Profile & daily routine | Perfil y rutina diaria | 个人资料与日常安排
Accessibility | Accesibilidad | 无障碍设置
Text size | Tamaño del texto | 文字大小
Increase the text size. | Aumente el tamaño del texto. | 放大字体。
High contrast | Alto contraste | 高对比度
Use higher contrast. | Aumente el contraste. | 使用更高对比度。
Read page aloud | Leer página en voz alta | 朗读页面
Older adult's first name | Nombre de la persona mayor | 长者名字
Family member's display name | Nombre visible del familiar | 家属显示名称
Daily check-in target | Hora de registro diario | 每日签到时间
A family dashboard target time, not an automatic alert. | Hora orientativa, no es una alerta automática. | 仅供家人参考，不会自动提醒。
Save settings | Guardar cambios | 保存设置
Invite a trusted caregiver | Invitar a un familiar de confianza | 邀请可信赖的家人
Use the code to invite your family. | Use el código para invitar a su familia. | 使用邀请码邀请家人。
The code expires after 20 minutes. | El código caduca en 20 minutos. | 邀请码 20 分钟后失效。
Create invitation code | Crear código de invitación | 创建邀请码
Share this code privately: | Comparta este código en privado: | 请私下分享邀请码：
Copy code | Copiar código | 复制邀请码
Keep this code hidden from others. | No comparta este código con desconocidos. | 请勿向他人公开邀请码。
Family connections | Conexiones familiares | 家庭关联
Connect to another older adult | Conectar con otra persona mayor | 关联另一位长者
Link account | Vincular cuenta | 关联账户
About SeniorCare | Acerca de SeniorCare | 关于 SeniorCare
SeniorCare helps seniors and grandparents stay connected with their families through daily check-ins and messages. It also helps them keep track of everyday tasks and plans. | SeniorCare ayuda a las personas mayores a mantenerse en contacto con su familia mediante registros diarios y mensajes. También ayuda a organizar sus tareas y planes. | SeniorCare 帮助长者通过每日签到和留言与家人保持联系，也方便管理每天的任务与计划。
Make it yours ⚙️ | Personalice su cuenta ⚙️ | 个性化设置 ⚙️
Update your details and display settings. | Actualice sus datos y opciones de pantalla. | 更新个人信息和显示设置。
How will you use SeniorCare? | ¿Cómo usará SeniorCare? | 您想如何使用 SeniorCare？
Choose an account type. An older adult records check-ins; a trusted family member views updates after receiving an invitation. | Elija su tipo de cuenta. Las personas mayores se registran y sus familiares invitados pueden ver las novedades. | 请选择账户类型。长者可以每日签到，受邀家人可以查看动态。
Set up daily check-ins | Configurar registro diario | 设置每日签到
Connect to my loved one | Conectar con mi familiar | 关联家人账户
Use a separate account for the caregiver. | Use otra cuenta para el cuidador. | 家属请使用单独账户。
Create your SeniorCare account | Crear cuenta SeniorCare | 创建 SeniorCare 账户
Welcome to SeniorCare | Bienvenido a SeniorCare | 欢迎使用 SeniorCare
Both older adults and caregivers need their own accounts. | Mayores y familiares necesitan cuentas distintas. | 长者与家属需要分别注册账户。
Sign in to see your private check-ins and linked family updates. | Inicie sesión para ver sus registros y las novedades de su familia. | 登录查看自己的签到记录和家人的动态。
Email | Correo electrónico | 电子邮箱
Password | Contraseña | 密码
Create account | Crear cuenta | 创建账户
Sign in | Iniciar sesión | 登录
New here? Create an account | ¿Es nuevo? Cree una cuenta | 还没有账户？立即注册
Already have an account? Sign in | ¿Ya tiene cuenta? Inicie sesión | 已有账户？登录
I'm an older adult. My first name is: | Soy una persona mayor. Mi nombre es: | 我是长者，我的名字是：
I'm a family member. Enter my invitation code: | Soy familiar. Mi código de invitación es: | 我是家属，请输入邀请码：
Ask the older adult for their code | Pida el código a su familiar | 向长者索取邀请码
Invitation code | Código de invitación | 邀请码
Retry | Reintentar | 重试
Up to date | Actualizado | 已更新
Simulation | Simulación | 模拟
Daily Planner | Agenda diaria | 每日计划
You can put your daily task below and your family can also add tasks to stay organized. | Añada sus tareas diarias abajo. Su familia también puede añadir tareas para organizarse. | 您可以在下方添加每天的任务，家人也可以帮您添加，方便安排日常生活。
Today | Hoy | 今天
Upcoming | Próximamente | 即将到来
Selected day | Día elegido | 选定日期
Care calendar | Calendario familiar | 家庭日历
Tap a date to view upcoming tasks and events. A dot means a task is scheduled. | Toque una fecha para ver las tareas. Un punto indica que hay una tarea. | 点击日期查看任务。小圆点表示当天有安排。
Tasks today | Tareas de hoy | 今日任务
Completed | Completadas | 已完成
Still to do | Pendientes | 待完成
Hide calendar | Ocultar calendario | 隐藏日历
Show calendar | Mostrar calendario | 显示日历
All | Todas | 全部
Medication | Medicación | 用药
Appointment | Cita | 预约
Important event | Evento importante | 重要事项
Exercise | Ejercicio | 运动
Other | Otro | 其他
Today’s tasks | Tareas de hoy | 今日任务
Nothing scheduled here | No hay tareas programadas | 暂无安排
No task today | No hay tareas hoy | 今天没有任务
Choose another date or add a task when you're ready. | Elija otra fecha o añada una tarea. | 请选择其他日期或添加任务。
Showing the first 50 tasks. | Se muestran las primeras 50 tareas. | 仅显示前 50 项任务。
Note to family | Mensaje para la familia | 留言给家人
If you have any concerns, you can leave a note for your family. They can read it when they open SeniorCare. | Si tiene alguna preocupación, deje un mensaje. Su familia podrá leerlo en SeniorCare. | 如有任何担忧，您可以给家人留言，他们打开 SeniorCare 后就能看到。
Save note | Guardar mensaje | 保存留言
Plan together | Planear en familia | 一起制定计划
Tasks you add appear on their planner. They can mark them complete. | Sus tareas aparecerán en la agenda y la persona mayor podrá completarlas. | 您添加的任务会出现在长者日程中，长者可以标记完成。
What needs doing? | ¿Qué hay que hacer? | 需要做什么？
Category | Categoría | 类别
Date | Fecha | 日期
Time (optional) | Hora (opcional) | 时间（选填）
Repeat | Repetir | 重复
Notes (optional) | Notas (opcional) | 备注（选填）
Only once | Una vez | 仅一次
Every day | Cada día | 每天
Every week | Cada semana | 每周
Add to care planner | Añadir a agenda | 添加到日程
Edit task | Editar tarea | 编辑任务
Add something important | Añadir una tarea | 添加任务
Save changes | Guardar cambios | 保存更改
Delete task | Eliminar tarea | 删除任务
Daily | Diario | 每日
Weekly | Semanal | 每周
Tomorrow | Mañana | 明天
Coming up | Próximamente | 即将到来
The next 21 days. | Próximos 21 días. | 未来 21 天。
Appointments, medicines and events for this day. | Citas, medicinas y eventos para este día. | 当天的预约、用药和活动。
Find places near your area | Encuentre lugares cerca de usted | 查找附近地点
Explore nearby places 📍 | Explorar lugares cercanos 📍 | 探索附近地点 📍
Find pharmacies, parks, groceries, and other useful places with an easy-to-use Google Map. | Busque farmacias, parques, tiendas y otros lugares en Google Maps. | 使用谷歌地图查找附近的药店、公园、超市等。
What would you like to find? | ¿Qué desea encontrar? | 想找什么地方？
Pick a category, then enter a city or use your location to search Google Maps. | Elija una categoría y escriba una ciudad o use su ubicación. | 请选择地点类别，然后输入城市或使用定位搜索。
or search by city | o buscar por ciudad | 或按城市搜索
City or ZIP code | Ciudad o código postal | 城市或邮政编码
Find on map | Buscar en mapa | 在地图上查找
My saved places | Mis lugares guardados | 我收藏的地点
Select one to display it on the map. | Elija uno para mostrarlo en el mapa. | 选择一个地点以在地图上显示。
Search saved places | Buscar lugares guardados | 搜索收藏地点
Loading your saved places… | Cargando lugares guardados… | 正在加载收藏地点…
Save a place | Guardar un lugar | 收藏地点
Found a place in Google Maps? Save its name and address for easy access later. | ¿Encontró un sitio en Google Maps? Guarde su nombre y dirección. | 在谷歌地图上找到了地点？可以保存名称和地址，方便下次访问。
Place name | Nombre del lugar | 地点名称
Address | Dirección | 地址
Save place | Guardar lugar | 保存地点
Remove | Quitar | 移除
Directions | Indicaciones | 路线
Open in Google Maps | Abrir en Google Maps | 在谷歌地图中打开
Get directions | Cómo llegar | 获取路线
Search | Buscar | 搜索
Pharmacies | Farmacias | 药店
Doctors & clinics | Médicos y clínicas | 医生与诊所
Groceries | Supermercados | 超市
Parks | Parques | 公园
Libraries | Bibliotecas | 图书馆
Senior centers | Centros para mayores | 老年活动中心
Cafés | Cafeterías | 咖啡馆
Choose a category and search to see Google Maps | Elija una categoría y busque en Google Maps | 选择类别并搜索谷歌地图
SeniorCare Kitchen | Cocina SeniorCare | SeniorCare 厨房
What can we cook today? 🍳 | ¿Qué cocinamos hoy? 🍳 | 今天做什么菜？🍳
Use what is in your kitchen to discover recipes with clear instructions. | Busque recetas usando los ingredientes que ya tiene en casa. | 用家里的食材查找食谱和做法。
Find something delicious | Encuentre algo rico | 寻找美味食谱
Recipes come from real cooking websites, not AI-generated instructions. | Las recetas vienen de sitios de cocina, no son inventadas por IA. | 食谱来自真实的美食网站，并非 AI 编写。
What ingredients do you have? | ¿Qué ingredientes tiene? | 您有哪些食材？
Search for a dish (optional) | Buscar plato (opcional) | 搜索菜名（选填）
Cuisine | Cocina | 菜系
Any cuisine | Cualquier cocina | 不限菜系
Ingredients to avoid (not an allergy check) | Ingredientes que evitar (no comprueba alergias) | 避免的食材（不能代替过敏检查）
Show vegetarian-category recipes only | Solo recetas vegetarianas | 只显示素食类食谱
Find real recipes | Buscar recetas | 查找食谱
Searching… | Buscando… | 搜索中…
Surprise me | Sorpréndeme | 随机推荐
View recipe and instructions | Ver receta e instrucciones | 查看食谱和做法
Back to recipes | Volver a las recetas | 返回食谱列表
Ingredients | Ingredientes | 食材
Instructions from the recipe website | Instrucciones del sitio de recetas | 食谱网站提供的做法
Read on recipe website | Ver en sitio original | 查看原网站食谱
Looking up recipes from TheMealDB… | Buscando recetas en TheMealDB… | 正在从 TheMealDB 查找食谱…
No matching recipes found | No se encontraron recetas | 没有找到符合条件的食谱
Try a different ingredient, cuisine, or fewer restrictions. | Pruebe con otro ingrediente o menos restricciones. | 请尝试其他食材、菜系或减少限制条件。
Recipes you can try | Recetas para probar | 推荐食谱
Sorted by how many listed ingredients you already have. | Ordenadas según los ingredientes que ya tiene. | 按家中已有食材数量排序。
Your next meal starts here | Su próxima comida empieza aquí | 下一餐从这里开始
Enter a few ingredients, or search for a dish to see real recipes. | Escriba ingredientes o busque un plato para ver recetas reales. | 输入食材或菜名，查找真实食谱。
World cuisine | Cocina internacional | 世界美食
Meal | Plato | 菜肴
Italian | Italiana | 意大利菜
Chinese | China | 中餐
American | Estadounidense | 美式
British | Británica | 英式
Canadian | Canadiense | 加拿大菜
French | Francesa | 法式
Greek | Griega | 希腊菜
Indian | India | 印度菜
Japanese | Japonesa | 日式
Mexican | Mexicana | 墨西哥菜
Moroccan | Marroquí | 摩洛哥菜
Thai | Tailandesa | 泰式
Turkish | Turca | 土耳其菜
Vietnamese | Vietnamita | 越南菜
Vegetarian | Vegetariana | 素菜
Vegan | Vegana | 纯素
Beef | Carne de res | 牛肉
Chicken | Pollo | 鸡肉
Seafood | Mariscos | 海鲜
Miscellaneous | Varios | 其他
Breakfast | Desayuno | 早餐
Starter | Entrante | 前菜
Pasta | Pasta | 意大利面
Side | Guarnición | 配菜
Dessert | Postre | 甜点
SeniorCare — A little check-in. A lot of peace of mind. | SeniorCare — Comunicación familiar diaria | SeniorCare — 每日家庭关怀
`;
const dictionary={es:Object.create(null),zh:Object.create(null)};
for(const line of rows.trim().split('\n')){
  const parts=line.split(' | ');
  if(parts.length===3){dictionary.es[parts[0]]=parts[1];dictionary.zh[parts[0]]=parts[2];}
}
function translateBase(str,language){
  const lookup=dictionary[language];
  if(!lookup) return str;
  if(Object.prototype.hasOwnProperty.call(lookup,str)) return lookup[str];
  const icon=str.match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}][\s\S]*)$/u);
  if(icon && icon[1] && lookup[icon[2]]) return icon[1]+lookup[icon[2]];
  let m;
  if((m=str.match(/^Good (morning|afternoon|evening), (.+)\.$/))){
    const wishes=language==='zh'?{morning:'早上好',afternoon:'下午好',evening:'晚上好'}:{morning:'Buenos días',afternoon:'Buenas tardes',evening:'Buenas noches'};
    return language==='zh'?m[2]+'，'+wishes[m[1]]+'。':wishes[m[1]]+', '+m[2]+'.';
  }
  if((m=str.match(/^Hello, (.+)\. 💚$/)))return language==='zh'?'您好，'+m[1]+'。💚':'Hola, '+m[1]+'. 💚';
  if((m=str.match(/^(.+)’s daily check-in$/)))return language==='zh'?m[1]+'的每日签到':'Registro diario de '+m[1];
  if((m=str.match(/^(.+)’s care planner 📅$/)))return language==='zh'?m[1]+'的照护日程 📅':'Agenda de '+m[1]+' 📅';
  if((m=str.match(/^(\d+) tasks?$/)))return language==='zh'?m[1]+' 项任务':m[1]+' tareas';
  if((m=str.match(/^(\d+) task$/)))return language==='zh'?m[1]+' 项任务':m[1]+' tarea';
  if((m=str.match(/^(\d+) of (\d+)$/)))return language==='zh'?m[1]+'/'+m[2]:m[1]+' de '+m[2];
  if((m=str.match(/^(\d+) linked caregivers?\..*$/)))return language==='zh'?'已关联 '+m[1]+' 位家属。':m[1]+' familiares conectados.';
  if((m=str.match(/^(\d+) of (\d+) listed ingredients in your kitchen · (\d+)% match$/)))return language==='zh'?'家中已有 '+m[1]+'/'+m[2]+' 种食材 · 匹配 '+m[3]+'%':m[1]+' de '+m[2]+' ingredientes en casa · '+m[3]+'% de coincidencia';
  if((m=str.match(/^Follow-up recorded for (.+) ✓$/)))return language==='zh'?m[1]+'的求助已回应 ✓':'Solicitud de '+m[1]+' atendida ✓';
  if((m=str.match(/^(.+)’s request was answered ✓$/)))return language==='zh'?m[1]+'的求助已回应 ✓':'Solicitud de '+m[1]+' atendida ✓';
  if((m=str.match(/^(.+) asked for support$/)))return language==='zh'?m[1]+' 请求帮助':m[1]+' pidió ayuda';
  if((m=str.match(/^(.+) checked in today ✓$/)))return language==='zh'?m[1]+' 今日已报平安 ✓':m[1]+' confirmó su estado hoy ✓';
  if((m=str.match(/^Checked in at (.+)\.$/)))return language==='zh'?'签到时间：'+m[1]:'Registrado a las '+m[1]+'.';
  if((m=str.match(/^Tasks for (.+)$/)))return language==='zh'?m[1]+'的任务':'Tareas del '+m[1];
  if((m=str.match(/^Add a task for (.+)$/)))return language==='zh'?'给'+m[1]+'添加任务':'Añadir tarea para '+m[1];
  return str;
}
export function translate(text,language=active){
  if(language==='en')return String(text??'');
  const value=String(text??'');
  const m=value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return m?m[1]+translateBase(m[2],language)+m[3]:value;
}
const nodeSources=new WeakMap(),attrSources=new WeakMap();
function excluded(el){return !!el?.closest?.('script,style,textarea,[data-original-language],.recipe-directions,.recipe-ingredients,.task-details,.care-task-body strong,.recipe-card h3,.recipe-detail h2,.nearby-saved-list strong');}
function applyText(node){
  if(excluded(node.parentElement))return;
  let saved=nodeSources.get(node);
  if(!saved || node.nodeValue!==saved.last){saved={source:node.nodeValue,last:node.nodeValue};nodeSources.set(node,saved);}
  const target=translate(saved.source);
  if(node.nodeValue!==target)node.nodeValue=target;
  saved.last=target;
}
function applyAttrs(el){
  if(excluded(el))return;
  let attrs=attrSources.get(el);
  if(!attrs){attrs=Object.create(null);attrSources.set(el,attrs);}
  for(const name of ['placeholder','title','aria-label']){
    if(!el.hasAttribute(name))continue;
    const current=el.getAttribute(name),old=attrs[name];
    if(!old||old.last!==current)attrs[name]={source:current,last:current};
    const next=translate(attrs[name].source);
    if(next!==current)el.setAttribute(name,next);
    attrs[name].last=next;
  }
}
export function translateDOM(root=document.body){
  document.documentElement.lang=active;
  document.title=translate('SeniorCare — A little check-in. A lot of peace of mind.');
  if(!root)return;
  if(root.nodeType===3){applyText(root);return;}
  if(root.nodeType!==1&&root.nodeType!==9)return;
  if(root.nodeType===1)applyAttrs(root);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
    if(node.nodeType===3)applyText(node);
    else applyAttrs(node);
  }
}
export function setLanguage(language){
  active=Object.prototype.hasOwnProperty.call(LANGUAGES,language)?language:'en';
  try{localStorage.setItem(STORAGE_KEY,active);}catch(_){}
  document.documentElement.lang=active;
  return active;
}
export function initLanguageSelector(){
  const select=document.getElementById('language-select');
  if(select)select.value=active;
  document.documentElement.lang=active;
}
