!function (window) {
  "use strict";

  var LOCAL_STORAGE_KEY = "afroseller_social_commerce_os_v1";
  var META_STORAGE_KEY = "afroseller_social_commerce_os_cloud_v1";

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function cleanEnum(value, allowed, fallback) {
    return allowed.indexOf(value) >= 0 ? value : fallback;
  }

  function isoFromDate(value) {
    var date = String(value || todayKey()).slice(0, 10);
    return date + "T12:00:00.000Z";
  }

  function orderBalance(order) {
    return Math.max(0, number(order.orderAmount) + number(order.deliveryFee) - number(order.amountPaid));
  }

  function productStatus(product) {
    if (number(product.stock) <= 0) return "out of stock";
    if (number(product.stock) <= number(product.reorderLevel)) return "low stock";
    return cleanEnum(product.status || "ready", ["ready", "low stock", "out of stock", "archived"], "ready");
  }

  function paymentStatus(order) {
    if (!order || order.orderStatus === "cancelled") return "void";
    if (number(order.amountPaid) <= 0 || order.paymentMethod === "unpaid") return "unpaid";
    return orderBalance(order) > 0 ? "partial" : "paid";
  }

  function waitForAuth() {
    return new Promise(function (resolve) {
      if (window.AfroAuth && typeof window.AfroAuth.onReady === "function") {
        window.AfroAuth.onReady(resolve);
        return;
      }
      resolve();
    });
  }

  async function getClient() {
    await waitForAuth();
    if (window.AfroAuth && typeof window.AfroAuth.getSupabase === "function") {
      return window.AfroAuth.getSupabase();
    }
    return null;
  }

  async function getSignedInUser(client) {
    if (!client || !client.auth || typeof client.auth.getUser !== "function") return null;
    var result = await client.auth.getUser();
    if (result.error) throw result.error;
    return result.data && result.data.user ? result.data.user : null;
  }

  async function getReadyClient() {
    var client = await getClient();
    if (!client || !client.from) throw new Error("Supabase browser client is not available.");
    var user = await getSignedInUser(client);
    if (!user || !user.id) throw new Error("Sign in with an AfroTools Pro account before syncing.");
    return { client: client, user: user };
  }

  async function isCloudAvailable() {
    try {
      await getReadyClient();
      return true;
    } catch (err) {
      return false;
    }
  }

  function getCloudMeta() {
    return readJson(META_STORAGE_KEY, {});
  }

  function setCloudMeta(meta) {
    var current = getCloudMeta();
    var next = Object.assign({}, current, meta || {});
    writeJson(META_STORAGE_KEY, next);
    return next;
  }

  async function checked(result, label) {
    if (result && result.error) {
      throw new Error(label + ": " + (result.error.message || "Supabase request failed"));
    }
    return result ? result.data : null;
  }

  async function loadBusinesses() {
    var ready = await getReadyClient();
    var result = await ready.client
      .from("seller_businesses")
      .select("id,name,country,currency_code,language_lane,seller_channel,phone_whatsapp,status,updated_at,created_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false });
    return await checked(result, "Load seller businesses") || [];
  }

  function businessPayload(localState) {
    var business = localState && localState.business ? localState.business : {};
    return {
      name: business.name || "My AfroSeller business",
      country: business.country || "",
      currency_code: business.currency || "NGN",
      language_lane: cleanEnum(business.language || "English", ["English", "French", "Kiswahili", "Pidgin"], "English"),
      seller_channel: cleanEnum(business.channel || "WhatsApp", ["WhatsApp", "Instagram", "Shop", "Market", "Mixed"], "WhatsApp"),
      phone_whatsapp: business.phone || "",
      settings: { localStorageKey: LOCAL_STORAGE_KEY },
      status: "active"
    };
  }

  function businessInsertPayload(localState, userId) {
    return Object.assign({ owner_id: userId }, businessPayload(localState));
  }

  async function createBusinessFromLocalSnapshot(localState) {
    var ready = await getReadyClient();
    var result = await ready.client
      .from("seller_businesses")
      .insert(businessInsertPayload(localState || readJson(LOCAL_STORAGE_KEY, {}), ready.user.id))
      .select("id,name,country,currency_code,language_lane,seller_channel,phone_whatsapp,status,updated_at,created_at")
      .single();
    var business = await checked(result, "Create seller business");
    setCloudMeta({ businessId: business.id, lastSyncedAt: null, lastCloudStatus: "created" });
    return business;
  }

  async function deleteRows(client, table, businessId) {
    var result = await client.from(table).delete().eq("business_id", businessId);
    await checked(result, "Clear " + table);
  }

  async function insertRows(client, table, rows, label) {
    if (!rows || !rows.length) return [];
    var result = await client.from(table).insert(rows).select("*");
    return await checked(result, label || ("Insert " + table)) || [];
  }

  function localProducts(localState) {
    return Array.isArray(localState && localState.products) ? localState.products : [];
  }

  function localOrders(localState) {
    return Array.isArray(localState && localState.orders) ? localState.orders : [];
  }

  function localCustomers(localState) {
    return Array.isArray(localState && localState.customers) ? localState.customers : [];
  }

  function localMovements(localState) {
    return Array.isArray(localState && localState.stockMovements) ? localState.stockMovements : [];
  }

  async function syncLocalSnapshot(localState, businessId) {
    var ready = await getReadyClient();
    var client = ready.client;
    var snapshot = localState || readJson(LOCAL_STORAGE_KEY, {});
    var targetBusinessId = businessId || getCloudMeta().businessId;
    if (!targetBusinessId) {
      var created = await createBusinessFromLocalSnapshot(snapshot);
      targetBusinessId = created.id;
    }

    await checked(await client
      .from("seller_businesses")
      .update(businessPayload(snapshot))
      .eq("id", targetBusinessId)
      .select("id")
      .single(), "Update seller business");

    await deleteRows(client, "seller_deliveries", targetBusinessId);
    await deleteRows(client, "seller_payments", targetBusinessId);
    await deleteRows(client, "seller_stock_movements", targetBusinessId);
    await deleteRows(client, "seller_order_items", targetBusinessId);
    await deleteRows(client, "seller_orders", targetBusinessId);
    await deleteRows(client, "seller_customer_labels", targetBusinessId);
    await deleteRows(client, "seller_customers", targetBusinessId);
    await deleteRows(client, "seller_product_variants", targetBusinessId);
    await deleteRows(client, "seller_products", targetBusinessId);

    var productRows = localProducts(snapshot).map(function (product) {
      return {
        business_id: targetBusinessId,
        sku: product.sku || product.id || null,
        name: product.name || "Untitled product",
        category: product.category || "",
        supplier: product.supplier || "",
        stock_location: product.stockLocation || "",
        photo_url: product.photoUrl || "",
        cost_price: number(product.costPrice),
        selling_price: number(product.sellingPrice),
        stock_on_hand: number(product.stock),
        reorder_level: number(product.reorderLevel),
        status: productStatus(product),
        metadata: { local_id: product.id || "", source: "afroseller-local-snapshot" }
      };
    });
    var savedProducts = await insertRows(client, "seller_products", productRows, "Insert seller products");
    var productIdByLocalId = {};
    savedProducts.forEach(function (row) {
      if (row.metadata && row.metadata.local_id) productIdByLocalId[row.metadata.local_id] = row.id;
    });

    var variantRows = localProducts(snapshot).filter(function (product) {
      return product.variant || product.sku || product.supplier || product.stockLocation || product.photoUrl;
    }).map(function (product) {
      return {
        business_id: targetBusinessId,
        product_id: productIdByLocalId[product.id],
        sku: product.sku || product.id || null,
        variant_name: product.variant || "Default variant",
        size_label: "",
        color_label: "",
        supplier: product.supplier || "",
        stock_location: product.stockLocation || "",
        photo_url: product.photoUrl || "",
        cost_price: number(product.costPrice),
        selling_price: number(product.sellingPrice),
        stock_on_hand: number(product.stock),
        reorder_level: number(product.reorderLevel),
        status: productStatus(product),
        metadata: { local_id: product.id || "", source: "afroseller-local-snapshot" }
      };
    }).filter(function (row) {
      return !!row.product_id;
    });
    await insertRows(client, "seller_product_variants", variantRows, "Insert seller variants");

    var customerRows = localCustomers(snapshot).map(function (customer) {
      return {
        business_id: targetBusinessId,
        name: customer.name || "Unnamed customer",
        phone_whatsapp: customer.phone || "",
        default_address: "",
        last_order_note: customer.lastOrder || "",
        total_balance: number(customer.totalBalance),
        follow_status: cleanEnum(customer.followStatus || "New lead", ["New lead", "Send payment reminder", "Confirm delivery address", "Ready for repeat order", "Closed"], "New lead"),
        status: "active",
        metadata: { local_id: customer.id || "", source: "afroseller-local-snapshot" }
      };
    });
    var savedCustomers = await insertRows(client, "seller_customers", customerRows, "Insert seller customers");
    var customerIdByLocalId = {};
    var customerIdByName = {};
    savedCustomers.forEach(function (row) {
      if (row.metadata && row.metadata.local_id) customerIdByLocalId[row.metadata.local_id] = row.id;
      customerIdByName[String(row.name || "").toLowerCase()] = row.id;
    });

    var labelRows = [];
    localCustomers(snapshot).forEach(function (customer) {
      var customerId = customerIdByLocalId[customer.id] || customerIdByName[String(customer.name || "").toLowerCase()];
      (customer.labels || []).forEach(function (label) {
        labelRows.push({
          business_id: targetBusinessId,
          customer_id: customerId,
          label: cleanEnum(label, ["VIP", "Repeat buyer", "Owes balance", "Wholesale", "Delivery issue"], "Repeat buyer"),
          note: ""
        });
      });
    });
    await insertRows(client, "seller_customer_labels", labelRows.filter(function (row) { return !!row.customer_id; }), "Insert seller customer labels");

    var orderRows = localOrders(snapshot).map(function (order) {
      var total = number(order.orderAmount) + number(order.deliveryFee);
      return {
        business_id: targetBusinessId,
        customer_id: customerIdByName[String(order.customer || "").toLowerCase()] || null,
        order_no: order.id || null,
        order_date: String(order.date || todayKey()).slice(0, 10),
        channel: "WhatsApp",
        subtotal_amount: number(order.orderAmount),
        delivery_fee: number(order.deliveryFee),
        discount_amount: 0,
        total_amount: total,
        amount_paid: number(order.amountPaid),
        balance_due: orderBalance(order),
        latest_payment_method: cleanEnum(order.paymentMethod || "unpaid", ["cash", "bank transfer", "mobile money", "POS", "unpaid"], "unpaid"),
        payment_status: paymentStatus(order),
        order_status: cleanEnum(order.orderStatus || "draft", ["draft", "confirmed", "packed", "delivered", "paid", "cancelled"], "draft"),
        delivery_status: cleanEnum(order.deliveryStatus || "Pickup pending", ["Pickup pending", "Ready for dispatch", "Rider assigned", "In transit", "Delivered", "Cancelled"], "Pickup pending"),
        notes: order.dispatchNote || "",
        metadata: { local_id: order.id || "", source: "afroseller-local-snapshot" }
      };
    });
    var savedOrders = await insertRows(client, "seller_orders", orderRows, "Insert seller orders");
    var orderIdByLocalId = {};
    savedOrders.forEach(function (row) {
      if (row.metadata && row.metadata.local_id) orderIdByLocalId[row.metadata.local_id] = row.id;
    });

    var itemRows = localOrders(snapshot).map(function (order) {
      var productId = productIdByLocalId[order.productId] || null;
      return {
        business_id: targetBusinessId,
        order_id: orderIdByLocalId[order.id],
        product_id: productId,
        product_name_snapshot: order.productName || "Product",
        sku_snapshot: "",
        variant_snapshot: "",
        quantity: Math.max(1, number(order.quantity)),
        unit_cost: 0,
        unit_price: number(order.orderAmount) / Math.max(1, number(order.quantity)),
        line_total: number(order.orderAmount),
        metadata: { local_id: (order.id || "") + "-item", source: "afroseller-local-snapshot" }
      };
    }).filter(function (row) {
      return !!row.order_id;
    });
    await insertRows(client, "seller_order_items", itemRows, "Insert seller order items");

    var paymentRows = localOrders(snapshot).map(function (order) {
      return {
        business_id: targetBusinessId,
        order_id: orderIdByLocalId[order.id] || null,
        customer_id: customerIdByName[String(order.customer || "").toLowerCase()] || null,
        payment_method: cleanEnum(order.paymentMethod || "unpaid", ["cash", "bank transfer", "mobile money", "POS", "unpaid"], "unpaid"),
        amount: number(order.amountPaid),
        payment_status: number(order.amountPaid) > 0 ? "recorded" : "pending",
        proof_note: order.paymentProofNote || "",
        reference_note: "",
        is_manual_record: true,
        received_at: number(order.amountPaid) > 0 ? isoFromDate(order.date) : null,
        metadata: { local_order_id: order.id || "", source: "afroseller-local-snapshot" }
      };
    }).filter(function (row) {
      return !!row.order_id;
    });
    await insertRows(client, "seller_payments", paymentRows, "Insert seller payments");

    var deliveryRows = localOrders(snapshot).map(function (order) {
      return {
        business_id: targetBusinessId,
        order_id: orderIdByLocalId[order.id],
        customer_id: customerIdByName[String(order.customer || "").toLowerCase()] || null,
        customer_address: order.customerAddress || "",
        delivery_fee: number(order.deliveryFee),
        rider_contact: order.riderContact || "",
        dispatch_note: order.dispatchNote || "",
        proof_of_delivery_note: order.podNote || "",
        delivery_status: cleanEnum(order.deliveryStatus || "Pickup pending", ["Pickup pending", "Ready for dispatch", "Rider assigned", "In transit", "Delivered", "Cancelled"], "Pickup pending"),
        delivered_at: order.deliveryStatus === "Delivered" ? isoFromDate(order.date) : null,
        metadata: { local_order_id: order.id || "", source: "afroseller-local-snapshot" }
      };
    }).filter(function (row) {
      return !!row.order_id;
    });
    await insertRows(client, "seller_deliveries", deliveryRows, "Insert seller deliveries");

    var movementRows = localMovements(snapshot).map(function (movement) {
      return {
        business_id: targetBusinessId,
        product_id: productIdByLocalId[movement.productId] || null,
        movement_type: cleanEnum(movement.type || "adjustment", ["sale", "restock", "adjustment", "damage", "return"], "adjustment"),
        quantity_delta: number(movement.quantity) || 1,
        stock_after: movement.stockAfter == null ? null : number(movement.stockAfter),
        reason_note: movement.note || "",
        source_type: "manual",
        occurred_at: isoFromDate(movement.date),
        metadata: { local_id: movement.id || "", source: "afroseller-local-snapshot" }
      };
    }).filter(function (row) {
      return !!row.product_id && number(row.quantity_delta) !== 0;
    });
    await insertRows(client, "seller_stock_movements", movementRows, "Insert seller stock movements");

    var syncedAt = new Date().toISOString();
    setCloudMeta({ businessId: targetBusinessId, lastSyncedAt: syncedAt, lastCloudStatus: "synced" });
    return {
      businessId: targetBusinessId,
      lastSyncedAt: syncedAt,
      counts: {
        products: productRows.length,
        variants: variantRows.length,
        customers: customerRows.length,
        orders: orderRows.length,
        payments: paymentRows.length,
        deliveries: deliveryRows.length,
        stockMovements: movementRows.length
      }
    };
  }

  async function selectByBusiness(client, table, businessId, columns, orderColumn) {
    var query = client.from(table).select(columns || "*").eq("business_id", businessId);
    if (orderColumn) query = query.order(orderColumn, { ascending: false });
    return await checked(await query, "Load " + table) || [];
  }

  async function loadBusinessSnapshot(businessId) {
    var ready = await getReadyClient();
    var client = ready.client;
    var business = await checked(await client
      .from("seller_businesses")
      .select("*")
      .eq("id", businessId)
      .single(), "Load seller business");
    var products = await selectByBusiness(client, "seller_products", businessId, "*", "created_at");
    var variants = await selectByBusiness(client, "seller_product_variants", businessId, "*", "created_at");
    var customers = await selectByBusiness(client, "seller_customers", businessId, "*", "created_at");
    var labels = await selectByBusiness(client, "seller_customer_labels", businessId, "*", "created_at");
    var orders = await selectByBusiness(client, "seller_orders", businessId, "*", "order_date");
    var items = await selectByBusiness(client, "seller_order_items", businessId, "*", "created_at");
    var payments = await selectByBusiness(client, "seller_payments", businessId, "*", "created_at");
    var deliveries = await selectByBusiness(client, "seller_deliveries", businessId, "*", "created_at");
    var movements = await selectByBusiness(client, "seller_stock_movements", businessId, "*", "occurred_at");

    var variantByProductId = {};
    variants.forEach(function (variant) {
      if (!variantByProductId[variant.product_id]) variantByProductId[variant.product_id] = variant;
    });

    var productLocalIdByCloudId = {};
    var localProducts = products.map(function (product) {
      var variant = variantByProductId[product.id] || {};
      var localId = product.metadata && product.metadata.local_id ? product.metadata.local_id : product.id;
      productLocalIdByCloudId[product.id] = localId;
      return {
        id: localId,
        name: product.name,
        sku: product.sku || "",
        category: product.category || "",
        variant: variant.variant_name || "",
        supplier: variant.supplier || product.supplier || "",
        stockLocation: variant.stock_location || product.stock_location || "",
        photoUrl: variant.photo_url || product.photo_url || "",
        costPrice: number(variant.cost_price == null ? product.cost_price : variant.cost_price),
        sellingPrice: number(variant.selling_price == null ? product.selling_price : variant.selling_price),
        stock: number(variant.stock_on_hand == null ? product.stock_on_hand : variant.stock_on_hand),
        reorderLevel: number(variant.reorder_level == null ? product.reorder_level : variant.reorder_level),
        status: product.status || "ready"
      };
    });

    var labelsByCustomerId = {};
    labels.forEach(function (label) {
      labelsByCustomerId[label.customer_id] = labelsByCustomerId[label.customer_id] || [];
      labelsByCustomerId[label.customer_id].push(label.label);
    });
    var customerNameById = {};
    var localCustomers = customers.map(function (customer) {
      customerNameById[customer.id] = customer.name;
      return {
        id: customer.metadata && customer.metadata.local_id ? customer.metadata.local_id : customer.id,
        name: customer.name,
        phone: customer.phone_whatsapp || "",
        lastOrder: customer.last_order_note || "",
        totalBalance: number(customer.total_balance),
        labels: labelsByCustomerId[customer.id] || [],
        followStatus: customer.follow_status || "New lead"
      };
    });

    var firstItemByOrderId = {};
    items.forEach(function (item) {
      if (!firstItemByOrderId[item.order_id]) firstItemByOrderId[item.order_id] = item;
    });
    var paymentByOrderId = {};
    payments.forEach(function (payment) {
      if (payment.order_id && !paymentByOrderId[payment.order_id]) paymentByOrderId[payment.order_id] = payment;
    });
    var deliveryByOrderId = {};
    deliveries.forEach(function (delivery) {
      if (!deliveryByOrderId[delivery.order_id]) deliveryByOrderId[delivery.order_id] = delivery;
    });

    var localOrders = orders.map(function (order) {
      var item = firstItemByOrderId[order.id] || {};
      var payment = paymentByOrderId[order.id] || {};
      var delivery = deliveryByOrderId[order.id] || {};
      return {
        id: order.order_no || order.id,
        date: order.order_date || todayKey(),
        customer: customerNameById[order.customer_id] || "Customer",
        productId: productLocalIdByCloudId[item.product_id] || "",
        productName: item.product_name_snapshot || "Product",
        quantity: number(item.quantity) || 1,
        orderAmount: number(order.subtotal_amount),
        amountPaid: number(order.amount_paid),
        paymentMethod: payment.payment_method || order.latest_payment_method || "unpaid",
        paymentProofNote: payment.proof_note || "",
        customerAddress: delivery.customer_address || "",
        deliveryFee: number(order.delivery_fee),
        riderContact: delivery.rider_contact || "",
        dispatchNote: delivery.dispatch_note || order.notes || "",
        podNote: delivery.proof_of_delivery_note || "",
        deliveryStatus: order.delivery_status || delivery.delivery_status || "Pickup pending",
        orderStatus: order.order_status || "draft"
      };
    });

    var localMovements = movements.map(function (movement) {
      return {
        id: movement.metadata && movement.metadata.local_id ? movement.metadata.local_id : movement.id,
        date: String(movement.occurred_at || todayKey()).slice(0, 10),
        type: movement.movement_type,
        productId: productLocalIdByCloudId[movement.product_id] || "",
        productName: "",
        quantity: number(movement.quantity_delta),
        stockAfter: movement.stock_after == null ? "" : number(movement.stock_after),
        note: movement.reason_note || ""
      };
    });
    localMovements.forEach(function (movement) {
      var product = localProducts.find(function (item) { return item.id === movement.productId; });
      movement.productName = product ? product.name : "";
    });

    var state = {
      business: {
        name: business.name || "My AfroSeller business",
        country: business.country || "",
        currency: business.currency_code || "NGN",
        language: business.language_lane || "English",
        channel: business.seller_channel || "WhatsApp",
        phone: business.phone_whatsapp || ""
      },
      products: localProducts,
      orders: localOrders,
      customers: localCustomers,
      stockMovements: localMovements,
      updatedAt: new Date().toISOString()
    };
    setCloudMeta({ businessId: businessId, lastPulledAt: new Date().toISOString(), lastCloudStatus: "pulled" });
    return state;
  }

  window.AfroSellerSync = {
    localStorageKey: LOCAL_STORAGE_KEY,
    metaStorageKey: META_STORAGE_KEY,
    isCloudAvailable: isCloudAvailable,
    loadBusinesses: loadBusinesses,
    createBusinessFromLocalSnapshot: createBusinessFromLocalSnapshot,
    syncLocalSnapshot: syncLocalSnapshot,
    loadBusinessSnapshot: loadBusinessSnapshot,
    getCloudMeta: getCloudMeta,
    setCloudMeta: setCloudMeta
  };
}(window);
