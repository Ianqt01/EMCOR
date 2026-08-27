const SESSION_KEY = "emcor_session";
function getSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||"null")}catch(e){return null}}
function requireAuth(){
  const s=getSession();
  if(!s || !s.token || !s.username){location.href="index.html";return}
  if(s.expiresAt && Date.now()>s.expiresAt){localStorage.removeItem(SESSION_KEY);location.href="index.html"}
}
function logout(){localStorage.removeItem(SESSION_KEY);location.href="index.html"}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function peso(v){return "₱"+Number(v||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}
function badge(status){let c=String(status).toLowerCase().replace(/\s/g,"-");return `<span class="badge ${c==='available'?'ok':c==='low-stock'?'low':'out'}">${esc(status)}</span>`}
function renderShell(title){
 const s=getSession(); const admin=s.role==="admin";
 const links=[
 ["dashboard.html","Dashboard"],
 ["inventory.html","Products / Inventory"],
 ["stock-in.html","Stock In"],
 ["stock-out.html","Stock Out / Sales"],
 ["suppliers.html","Suppliers"],
 ["reports.html","Reports"]
 ];
 if(admin)links.push(["users.html","User Management"]);
 const current=location.pathname.split("/").pop()||"dashboard.html";
 document.getElementById("app").innerHTML=`
 <div class="mobile-header"><a href="dashboard.html">EMCOR</a><span>${esc(s.username)} · ${esc(s.role)}</span></div>
 <div class="app-shell"><aside class="sidebar"><div class="logo">EMCOR</div><div class="logo-sub">APPLIANCE STORE INVENTORY</div><nav class="nav">
 ${links.map(x=>`<a class="${current===x[0]?'active':''}" href="${x[0]}">${x[1]}</a>`).join("")}
 <a href="#" onclick="logout();return false">Logout</a></nav></aside>
 <main class="main"><div class="topbar"><h2>${esc(title)}</h2><div class="user-pill">${esc(s.username)} · ${esc(s.role)}</div></div><div id="pageContent"></div></main></div>`;
}
async function loadDashboard(){
 const c=document.getElementById("pageContent"); c.innerHTML='<div class="section">Loading dashboard...</div>';
 try{
  const r=await api("dashboard",{token:getSession().token});
  c.innerHTML=`<div class="grid cards">
  <div class="card"><div class="label">Total Products</div><div class="value">${r.data.totalProducts}</div></div>
  <div class="card"><div class="label">Total Stock</div><div class="value">${r.data.totalStock}</div></div>
  <div class="card"><div class="label">Low Stock</div><div class="value">${r.data.lowStock}</div></div>
  <div class="card"><div class="label">Today's Sales</div><div class="value">${peso(r.data.todaySales)}</div></div></div>
  <div class="section"><div class="section-head"><h3>Recent Transactions</h3></div>${transactionTable(r.data.recent)}</div>`;
 }catch(e){c.innerHTML=`<div class="section danger-text">${esc(e.message)}</div>`}
}
function transactionTable(rows){
 if(!rows?.length)return '<div class="empty">No transactions yet.</div>';
 return `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Product</th><th>Qty</th><th>Amount</th><th>User</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.type)}</td><td>${esc(x.product_name)}</td><td>${esc(x.quantity)}</td><td>${peso(x.amount)}</td><td>${esc(x.user_id)}</td></tr>`).join("")}</tbody></table></div>`;
}
async function loadInventory(){
 const c=document.getElementById("pageContent");
 c.innerHTML=`<div class="section"><div class="section-head"><h3>Inventory</h3><button class="btn primary" onclick="openProductModal()">+ Add Product</button></div><div class="toolbar"><input id="productSearch" placeholder="Search product, brand, model..." oninput="filterProducts()"></div><div id="productTable"></div></div><div id="modal" class="modal"></div>`;
 try{const r=await api("getProducts",{token:getSession().token});window.products=r.data; renderProducts();}
 catch(e){document.getElementById("productTable").innerHTML=`<div class="danger-text">${esc(e.message)}</div>`}
}
function renderProducts(){
 const q=(document.getElementById("productSearch")?.value||"").toLowerCase();
 const rows=(window.products||[]).filter(x=>[x.product_id,x.product_name,x.brand,x.model,x.category].join(" ").toLowerCase().includes(q));
 document.getElementById("productTable").innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>ID</th><th>Product</th><th>Category</th><th>Brand</th><th>Selling Price</th><th>Stock</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.product_id)}</td><td><b>${esc(x.product_name)}</b><br><small>${esc(x.model)}</small></td><td>${esc(x.category)}</td><td>${esc(x.brand)}</td><td>${peso(x.selling_price)}</td><td>${esc(x.stock_quantity)}</td><td>${badge(x.status)}</td><td><button class="btn secondary" onclick='openProductModal(${JSON.stringify(x)})'>Edit</button></td></tr>`).join("")}</tbody></table></div>`:'<div class="empty">No products found.</div>';
}
function filterProducts(){renderProducts()}
function openProductModal(p=null){
 const m=document.getElementById("modal");
 m.innerHTML=`<div class="modal-box"><div class="modal-head"><h3>${p?"Edit Product":"Add Product"}</h3><button class="close" onclick="closeModal()">×</button></div>
 <form onsubmit="saveProduct(event)" class="form-grid">
 <input type="hidden" id="p_id" value="${esc(p?.product_id||"")}">
 <div class="field"><label>Product Name</label><input id="p_name" required value="${esc(p?.product_name||"")}"></div>
 <div class="field"><label>Category</label><select id="p_category" required>${["Refrigerator","Washing Machine","Television","Air Conditioner","Electric Fan","Rice Cooker","Microwave Oven","Other"].map(v=>`<option ${p?.category===v?"selected":""}>${v}</option>`).join("")}</select></div>
 <div class="field"><label>Brand</label><input id="p_brand" required value="${esc(p?.brand||"")}"></div>
 <div class="field"><label>Model</label><input id="p_model" value="${esc(p?.model||"")}"></div>
 <div class="field"><label>Cost Price</label><input id="p_cost" type="number" min="0" step="0.01" required value="${p?.cost_price||0}"></div>
 <div class="field"><label>Selling Price</label><input id="p_sell" type="number" min="0" step="0.01" required value="${p?.selling_price||0}"></div>
 <div class="field"><label>Stock Quantity</label><input id="p_stock" type="number" min="0" step="1" required value="${p?.stock_quantity||0}"></div>
 <div class="field"><label>Reorder Level</label><input id="p_reorder" type="number" min="0" step="1" required value="${p?.reorder_level||5}"></div>
 <div class="field full-row"><label>Description</label><textarea id="p_desc">${esc(p?.description||"")}</textarea></div>
 <div class="full-row"><button class="btn primary" type="submit">Save Product</button></div>
 </form></div>`;
 m.classList.add("show");
}
function closeModal(){document.getElementById("modal")?.classList.remove("show")}
async function saveProduct(e){
 e.preventDefault();
 const d={token:getSession().token,product_id:document.getElementById("p_id").value,product_name:document.getElementById("p_name").value.trim(),category:document.getElementById("p_category").value,brand:document.getElementById("p_brand").value.trim(),model:document.getElementById("p_model").value.trim(),cost_price:Number(document.getElementById("p_cost").value),selling_price:Number(document.getElementById("p_sell").value),stock_quantity:Number(document.getElementById("p_stock").value),reorder_level:Number(document.getElementById("p_reorder").value),description:document.getElementById("p_desc").value.trim()};
 try{await api(d.product_id?"updateProduct":"addProduct",d);closeModal();await loadInventory()}catch(err){alert(err.message)}
}
async function loadStockIn(){
 const c=document.getElementById("pageContent");
 c.innerHTML=`<div class="section"><div class="section-head"><h3>Record Stock In</h3></div><div class="notice">Use this form when new appliances arrive at the store. Stock is increased on the server after validation.</div><form onsubmit="submitStockIn(event)" class="form-grid"><div class="field"><label>Product</label><select id="si_product" required></select></div><div class="field"><label>Supplier</label><select id="si_supplier" required></select></div><div class="field"><label>Quantity</label><input id="si_qty" type="number" min="1" required></div><div class="field"><label>Cost Price</label><input id="si_cost" type="number" min="0" step="0.01" required></div><div class="field"><label>Reference Number</label><input id="si_ref" placeholder="SI-2026-001"></div><div class="full-row"><button class="btn primary">Save Stock In</button></div></form></div><div class="section"><h3>Recent Stock In</h3><div id="si_table">Loading...</div></div>`;
 try{const [p,s,r]=await Promise.all([api("getProducts",{token:getSession().token}),api("getSuppliers",{token:getSession().token}),api("getStockIn",{token:getSession().token})]);window.products=p.data;window.suppliers=s.data;document.getElementById("si_product").innerHTML=p.data.filter(x=>x.status!=="Inactive").map(x=>`<option value="${esc(x.product_id)}">${esc(x.product_name)} — ${esc(x.brand)} (${x.stock_quantity} in stock)</option>`).join("");document.getElementById("si_supplier").innerHTML=s.data.filter(x=>x.status!=="Inactive").map(x=>`<option value="${esc(x.supplier_id)}">${esc(x.supplier_name)}</option>`).join("");document.getElementById("si_table").innerHTML=transactionTable(r.data.map(x=>({...x,type:"STOCK IN",amount:Number(x.quantity)*Number(x.cost_price)})))}catch(e){alert(e.message)}
}
async function submitStockIn(e){e.preventDefault();try{await api("stockIn",{token:getSession().token,product_id:document.getElementById("si_product").value,supplier_id:document.getElementById("si_supplier").value,quantity:Number(document.getElementById("si_qty").value),cost_price:Number(document.getElementById("si_cost").value),reference_number:document.getElementById("si_ref").value.trim()});alert("Stock In recorded.");loadStockIn()}catch(err){alert(err.message)}}
async function loadStockOut(){
 const c=document.getElementById("pageContent");
 c.innerHTML=`<div class="section"><div class="section-head"><h3>Record Stock Out / Sale</h3></div><div class="notice">The server checks current stock before completing a sale.</div><form onsubmit="submitStockOut(event)" class="form-grid"><div class="field"><label>Product</label><select id="so_product" required></select></div><div class="field"><label>Quantity</label><input id="so_qty" type="number" min="1" required></div><div class="field"><label>Selling Price</label><input id="so_price" type="number" min="0" step="0.01" required></div><div class="field"><label>Customer Name</label><input id="so_customer" placeholder="Optional"></div><div class="field"><label>Reference Number</label><input id="so_ref" placeholder="SO-2026-001"></div><div class="full-row"><button class="btn primary">Save Stock Out</button></div></form></div><div class="section"><h3>Recent Stock Out</h3><div id="so_table">Loading...</div></div>`;
 try{const [p,r]=await Promise.all([api("getProducts",{token:getSession().token}),api("getStockOut",{token:getSession().token})]);window.products=p.data;document.getElementById("so_product").innerHTML=p.data.filter(x=>x.status==="Available"||x.status==="Low Stock").map(x=>`<option value="${esc(x.product_id)}">${esc(x.product_name)} — ${esc(x.brand)} (${x.stock_quantity} available)</option>`).join("");document.getElementById("so_table").innerHTML=transactionTable(r.data.map(x=>({...x,type:"STOCK OUT",amount:Number(x.quantity)*Number(x.selling_price)})))}catch(e){alert(e.message)}
}
async function submitStockOut(e){e.preventDefault();try{await api("stockOut",{token:getSession().token,product_id:document.getElementById("so_product").value,quantity:Number(document.getElementById("so_qty").value),selling_price:Number(document.getElementById("so_price").value),customer_name:document.getElementById("so_customer").value.trim(),reference_number:document.getElementById("so_ref").value.trim()});alert("Stock Out recorded.");loadStockOut()}catch(err){alert(err.message)}}
async function loadSuppliers(){
 const c=document.getElementById("pageContent");
 c.innerHTML=`<div class="section"><div class="section-head"><h3>Suppliers</h3><button class="btn primary" onclick="openSupplierModal()">+ Add Supplier</button></div><div id="supplierTable">Loading...</div></div><div id="modal" class="modal"></div>`;
 try{const r=await api("getSuppliers",{token:getSession().token});window.suppliers=r.data;renderSuppliers()}catch(e){document.getElementById("supplierTable").innerHTML=esc(e.message)}
}
function renderSuppliers(){document.getElementById("supplierTable").innerHTML=window.suppliers.length?`<div class="table-wrap"><table><thead><tr><th>ID</th><th>Supplier</th><th>Contact</th><th>Phone</th><th>Email</th><th>Status</th><th>Action</th></tr></thead><tbody>${window.suppliers.map(x=>`<tr><td>${esc(x.supplier_id)}</td><td>${esc(x.supplier_name)}</td><td>${esc(x.contact_person)}</td><td>${esc(x.phone)}</td><td>${esc(x.email)}</td><td>${esc(x.status)}</td><td><button class="btn secondary" onclick='openSupplierModal(${JSON.stringify(x)})'>Edit</button></td></tr>`).join("")}</tbody></table></div>`:'<div class="empty">No suppliers.</div>'}
function openSupplierModal(s=null){const m=document.getElementById("modal");m.innerHTML=`<div class="modal-box"><div class="modal-head"><h3>${s?"Edit Supplier":"Add Supplier"}</h3><button class="close" onclick="closeModal()">×</button></div><form onsubmit="saveSupplier(event)" class="form-grid"><input type="hidden" id="s_id" value="${esc(s?.supplier_id||"")}"><div class="field"><label>Supplier Name</label><input id="s_name" required value="${esc(s?.supplier_name||"")}"></div><div class="field"><label>Contact Person</label><input id="s_contact" value="${esc(s?.contact_person||"")}"></div><div class="field"><label>Phone</label><input id="s_phone" value="${esc(s?.phone||"")}"></div><div class="field"><label>Email</label><input id="s_email" type="email" value="${esc(s?.email||"")}"></div><div class="field full-row"><label>Address</label><textarea id="s_address">${esc(s?.address||"")}</textarea></div><div class="full-row"><button class="btn primary">Save Supplier</button></div></form></div>`;m.classList.add("show")}
async function saveSupplier(e){e.preventDefault();const d={token:getSession().token,supplier_id:document.getElementById("s_id").value,supplier_name:document.getElementById("s_name").value.trim(),contact_person:document.getElementById("s_contact").value.trim(),phone:document.getElementById("s_phone").value.trim(),email:document.getElementById("s_email").value.trim(),address:document.getElementById("s_address").value.trim()};try{await api(d.supplier_id?"updateSupplier":"addSupplier",d);closeModal();loadSuppliers()}catch(err){alert(err.message)}}
async function loadReports(){
 const c=document.getElementById("pageContent");c.innerHTML=`<div class="section"><div class="section-head"><h3>Reports</h3><button class="btn secondary" onclick="window.print()">Print</button></div><div id="reportsContent">Loading...</div></div>`;
 try{const r=await api("reports",{token:getSession().token});c.querySelector("#reportsContent").innerHTML=`<div class="grid cards"><div class="card"><div class="label">Inventory Value</div><div class="value">${peso(r.data.inventoryValue)}</div></div><div class="card"><div class="label">Total Sales</div><div class="value">${peso(r.data.totalSales)}</div></div><div class="card"><div class="label">Stock In Units</div><div class="value">${r.data.stockInUnits}</div></div><div class="card"><div class="label">Stock Out Units</div><div class="value">${r.data.stockOutUnits}</div></div></div><div class="section"><h3>Low / Out of Stock</h3>${transactionTable(r.data.lowStock.map(x=>({date:"",type:x.status,product_name:x.product_name,quantity:x.stock_quantity,amount:x.selling_price,user_id:x.product_id})))}</div><div class="section"><h3>Recent Activity</h3>${transactionTable(r.data.recentActivity.map(x=>({date:x.timestamp,type:x.action,product_name:x.description,quantity:"",amount:0,user_id:x.user_id})))}</div>`}catch(e){document.getElementById("reportsContent").innerHTML=`<div class="danger-text">${esc(e.message)}</div>`}
}
async function loadUsers(){
 if(getSession().role!=="admin"){document.getElementById("pageContent").innerHTML='<div class="section danger-text">Admin access required.</div>';return}
 const c=document.getElementById("pageContent");c.innerHTML=`<div class="section"><div class="section-head"><h3>User Management</h3><button class="btn primary" onclick="openUserModal()">+ Add User</button></div><div class="notice">Passwords are hashed on the server. Do not store plain-text passwords in the spreadsheet.</div><div id="usersTable">Loading...</div></div><div id="modal" class="modal"></div>`;
 try{const r=await api("getUsers",{token:getSession().token});window.users=r.data;renderUsers()}catch(e){document.getElementById("usersTable").innerHTML=esc(e.message)}
}
function renderUsers(){document.getElementById("usersTable").innerHTML=window.users.length?`<div class="table-wrap"><table><thead><tr><th>ID</th><th>Username</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>${window.users.map(x=>`<tr><td>${esc(x.user_id)}</td><td>${esc(x.username)}</td><td>${esc(x.role)}</td><td>${esc(x.status)}</td><td><button class="btn secondary" onclick='openUserModal(${JSON.stringify(x)})'>Edit</button></td></tr>`).join("")}</tbody></table></div>`:'<div class="empty">No users.</div>'}
function openUserModal(u=null){const m=document.getElementById("modal");m.innerHTML=`<div class="modal-box"><div class="modal-head"><h3>${u?"Edit User":"Add User"}</h3><button class="close" onclick="closeModal()">×</button></div><form onsubmit="saveUser(event)" class="form-grid"><input type="hidden" id="u_id" value="${esc(u?.user_id||"")}"><div class="field"><label>Username</label><input id="u_name" required value="${esc(u?.username||"")}" ${u?"readonly":""}></div><div class="field"><label>Role</label><select id="u_role"><option ${u?.role==="admin"?"selected":""}>admin</option><option ${u?.role==="staff"?"selected":""}>staff</option></select></div><div class="field"><label>Status</label><select id="u_status"><option ${u?.status==="active"?"selected":""}>active</option><option ${u?.status==="inactive"?"selected":""}>inactive</option></select></div><div class="field"><label>${u?"New Password (optional)":"Password"}</label><input id="u_password" type="password" ${u?"":"required"} minlength="8"></div><div class="full-row"><button class="btn primary">Save User</button></div></form></div>`;m.classList.add("show")}
async function saveUser(e){e.preventDefault();const d={token:getSession().token,user_id:document.getElementById("u_id").value,username:document.getElementById("u_name").value.trim(),role:document.getElementById("u_role").value,status:document.getElementById("u_status").value,password:document.getElementById("u_password").value};try{await api(d.user_id?"updateUser":"addUser",d);closeModal();loadUsers()}catch(err){alert(err.message)}}
