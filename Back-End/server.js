const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ===== STATIC FILES (IMAGES) =====
app.use("/img", express.static(path.join(__dirname, "img")));

// ===== DB CONNECTION =====
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "pos_db",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    return;
  }
  console.log("Connected to MySQL (pos_db) database");
});

app.get("/", (req, res) => {
  res.send("POS backend server is running");
});

// ========== MENU ITEMS ==========
app.get("/api/menu_items", (req, res) => {
  const query = "SELECT * FROM menu_items WHERE is_active = 1";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post("/api/menu_items", (req, res) => {
  const { name, price, category, description, is_active } = req.body;

  if (!name || !price || !category) {
    return res
      .status(400)
      .json({ message: "name, price, category are required" });
  }

  const q =
    "INSERT INTO menu_items (name, description, price, category, is_active) VALUES (?, ?, ?, ?, ?)";
  db.query(
    q,
    [name, description || "", price, category, is_active ? 1 : 1],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      res.json({
        id: result.insertId,
        name,
        description: description || "",
        price,
        category,
        is_active: 1,
      });
    }
  );
});

app.put("/api/menu_items/:id", (req, res) => {
  const { id } = req.params;
  const { name, price, category, description, is_active } = req.body;

  if (!name || !price || !category) {
    return res
      .status(400)
      .json({ message: "name, price, category are required" });
  }

  const q =
    "UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, is_active = ? WHERE id = ?";
  db.query(
    q,
    [name, description || "", price, category, is_active ? 1 : 0, id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      res.json({
        id: Number(id),
        name,
        description: description || "",
        price,
        category,
        is_active: is_active ? 1 : 0,
      });
    }
  );
});

app.delete("/api/menu_items/:id", (req, res) => {
  const { id } = req.params;
  const q = "DELETE FROM menu_items WHERE id = ?";
  db.query(q, [id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    res.json({ message: "Menu item deleted" });
  });
});

// ========== EMPLOYEES ==========
app.get("/api/employees", (req, res) => {
  const query = "SELECT * FROM employees";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post("/api/employees", (req, res) => {
  const { first_name, last_name, employee_code, password } = req.body;

  if (!first_name || !last_name || !employee_code || !password) {
    return res.status(400).json({
      message: "first_name, last_name, employee_code, password required",
    });
  }

  const q = `
    INSERT INTO employees (first_name, last_name, employee_code, password_hash)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    q,
    [first_name, last_name, employee_code, password],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      res.status(201).json({
        id: result.insertId,
        first_name,
        last_name,
        employee_code,
      });
    }
  );
});

// ========== RESTAURANT TABLES ==========
app.get("/api/restaurant_tables", (req, res) => {
  const query =
    "SELECT id, table_number, capacity, status, zone FROM restaurant_tables";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post("/api/restaurant_tables", (req, res) => {
  const { table_number, capacity, status, zone } = req.body;

  if (!table_number || !capacity) {
    return res
      .status(400)
      .json({ message: "table_number and capacity are required" });
  }

  const query =
    "INSERT INTO restaurant_tables (table_number, capacity, status, zone) VALUES (?, ?, ?, ?)";
  db.query(
    query,
    [table_number, capacity, status || "available", zone || null],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      res.json({
        id: result.insertId,
        table_number,
        capacity,
        status: status || "available",
        zone: zone || null,
      });
    }
  );
});

app.put("/api/restaurant_tables/:id", (req, res) => {
  const { id } = req.params;
  const { table_number, capacity, status, zone } = req.body;

  if (!table_number || !capacity) {
    return res
      .status(400)
      .json({ message: "table_number and capacity are required" });
  }

  const query =
    "UPDATE restaurant_tables SET table_number = ?, capacity = ?, status = ?, zone = ? WHERE id = ?";
  db.query(
    query,
    [table_number, capacity, status, zone || null, id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Table not found" });
      }

      res.json({
        id: Number(id),
        table_number,
        capacity,
        status,
        zone: zone || null,
      });
    }
  );
});

app.delete("/api/restaurant_tables/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM restaurant_tables WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Table not found" });
    }

    res.json({ message: "Table deleted" });
  });
});

// ========== DINE-IN ORDERS & ORDER ITEMS ==========
const TAX_RATE = 0.0525;

// GET all dine-in orders
app.get("/api/orders", (req, res) => {
  const query = `
    SELECT o.id,
           o.table_id,
           o.employee_id,
           o.total_amount,
           o.status,
           o.created_at,
           e.first_name,
           e.last_name,
           e.employee_code,
           t.table_number
    FROM orders o
    JOIN employees e ON o.employee_id = e.id
    JOIN restaurant_tables t ON o.table_id = t.id
    ORDER BY o.created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// create dine-in order AND mark table reserved
app.post("/api/orders", (req, res) => {
  const { table_id, employee_id, items } = req.body;

  if (
    !table_id ||
    !employee_id ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      message: "table_id, employee_id and at least one item are required",
    });
  }

  let subtotal = 0;
  items.forEach((it) => {
    subtotal += Number(it.price) * Number(it.quantity);
  });

  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const totalWithTax = +(subtotal + tax).toFixed(2);

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: err.message });

    const insertOrderSql = `
      INSERT INTO orders (table_id, employee_id, total_amount, status)
      VALUES (?, ?, ?, 'open')
    `;

    db.query(
      insertOrderSql,
      [table_id, employee_id, totalWithTax],
      (errOrder, orderResult) => {
        if (errOrder) {
          return db.rollback(() =>
            res.status(500).json({ message: errOrder.message })
          );
        }

        const orderId = orderResult.insertId;

        const values = items.map((it) => [
          orderId,
          it.menu_item_id,
          it.quantity,
          it.price,
        ]);

        const insertItemsSql = `
          INSERT INTO order_items (order_id, menu_item_id, quantity, price)
          VALUES ?
        `;

        db.query(insertItemsSql, [values], (errItems) => {
          if (errItems) {
            return db.rollback(() =>
              res.status(500).json({ message: errItems.message })
            );
          }

          const updateTableSql =
            "UPDATE restaurant_tables SET status = 'reserved' WHERE id = ?";

          db.query(updateTableSql, [table_id], (errTable) => {
            if (errTable) {
              return db.rollback(() =>
                res.status(500).json({ message: errTable.message })
              );
            }

            db.commit((errCommit) => {
              if (errCommit) {
                return db.rollback(() =>
                  res.status(500).json({ message: errCommit.message })
                );
              }

              res.status(201).json({
                order_id: orderId,
                table_id,
                employee_id,
                subtotal,
                tax,
                total_amount: totalWithTax,
                status: "open",
                table_status: "reserved",
              });
            });
          });
        });
      }
    );
  });
});

// get items for one dine-in order
app.get("/api/orders/:id/items", (req, res) => {
  const orderId = req.params.id;
  const query = `
    SELECT oi.id, oi.order_id, oi.menu_item_id, oi.quantity, oi.price,
           m.name, m.category
    FROM order_items oi
    JOIN menu_items m ON oi.menu_item_id = m.id
    WHERE oi.order_id = ?
  `;
  db.query(query, [orderId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// update order status AND free table if done
app.put("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "status is required" });
  }

  const getOrderSql = "SELECT table_id FROM orders WHERE id = ?";

  db.query(getOrderSql, [id], (errOrder, orderRows) => {
    if (errOrder) {
      return res.status(500).json({ message: errOrder.message });
    }
    if (orderRows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const tableId = orderRows[0].table_id;

    const updateOrderSql = "UPDATE orders SET status = ? WHERE id = ?";

    db.query(updateOrderSql, [status, id], (errUpd, result) => {
      if (errUpd) {
        return res.status(500).json({ message: errUpd.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (status === "done" && tableId) {
        const freeTableSql =
          "UPDATE restaurant_tables SET status = 'available' WHERE id = ?";

        db.query(freeTableSql, [tableId], (errTable) => {
          if (errTable) {
            return res.status(500).json({ message: errTable.message });
          }

          return res.json({
            id: Number(id),
            status,
            table_id: tableId,
            table_status: "available",
          });
        });
      } else {
        return res.json({ id: Number(id), status });
      }
    });
  });
});

// delete order AND free its table
app.delete("/api/orders/:id", (req, res) => {
  const { id } = req.params;

  const getOrderSql = "SELECT table_id FROM orders WHERE id = ?";

  db.query(getOrderSql, [id], (errOrder, orderRows) => {
    if (errOrder) {
      return res.status(500).json({ message: errOrder.message });
    }
    if (orderRows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const tableId = orderRows[0].table_id;

    const deleteSql = "DELETE FROM orders WHERE id = ?";

    db.query(deleteSql, [id], (errDel, result) => {
      if (errDel) {
        return res.status(500).json({ message: errDel.message });
      }

      if (tableId) {
        const freeTableSql =
          "UPDATE restaurant_tables SET status = 'available' WHERE id = ?";

        db.query(freeTableSql, [tableId], (errTable) => {
          if (errTable) {
            return res.status(500).json({ message: errTable.message });
          }

          return res.json({
            message: "Order deleted",
            table_id: tableId,
            table_status: "available",
          });
        });
      } else {
        return res.json({ message: "Order deleted" });
      }
    });
  });
});

// ========== AUTH: EMPLOYEE LOGIN ==========
app.post("/api/auth/login", (req, res) => {
  const { employee_code, password } = req.body;

  if (!employee_code || !password) {
    return res
      .status(400)
      .json({ message: "employee_code and password required" });
  }

  const query =
    "SELECT id, first_name, last_name, employee_code FROM employees WHERE employee_code = ? AND password_hash = ?";

  db.query(query, [employee_code, password], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const employee = results[0];
    res.json({
      token: `fake-token-${employee.id}-${Date.now()}`,
      employee,
    });
  });
});

// ========== ONLINE ORDERS ==========
app.get("/api/online_orders", (req, res) => {
  const query = `
    SELECT o.id,
           o.customer_id,
           o.customer_first_name,
           o.customer_last_name,
           o.customer_phone,
           o.customer_location,
           o.status,
           o.total_amount,
           o.tax_amount,
           o.payment_status,
           o.delivery_type,
           o.created_at,
           o.updated_at
    FROM online_orders o
    ORDER BY o.created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// CREATE online order
app.post("/api/online_orders", (req, res) => {
  const { first_name, last_name, phone, location, items, delivery_type } =
    req.body;

  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    !first_name ||
    !last_name ||
    !phone ||
    !location
  ) {
    return res.status(400).json({
      message:
        "first_name, last_name, phone, location and at least one item are required",
    });
  }

  const TAX_RATE_ONLINE = 0.11;

  let subtotal = 0;
  items.forEach((it) => {
    subtotal += Number(it.quantity) * Number(it.price);
  });

  const tax = +(subtotal * TAX_RATE_ONLINE).toFixed(2);
  const totalWithTax = +(subtotal + tax).toFixed(2);

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: err.message });

    const insertOrder = `
      INSERT INTO online_orders
        (customer_id,
         customer_first_name,
         customer_last_name,
         customer_phone,
         customer_location,
         status,
         total_amount,
         tax_amount,
         payment_status,
         delivery_type)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, 'unpaid', ?)
    `;

    db.query(
      insertOrder,
      [
        0,
        first_name,
        last_name,
        phone,
        location,
        totalWithTax,
        tax,
        delivery_type || "delivery",
      ],
      (err2, orderResult) => {
        if (err2) {
          return db.rollback(() => {
            res.status(500).json({ message: err2.message });
          });
        }

        const onlineOrderId = orderResult.insertId;

        const values = items.map((it) => [
          onlineOrderId,
          it.menu_item_id,
          it.quantity,
          it.price,
        ]);

        const insertItemsSql = `
          INSERT INTO online_order_items
            (online_order_id, menu_item_id, quantity, price)
          VALUES ?
        `;

        db.query(insertItemsSql, [values], (err3) => {
          if (err3) {
            return db.rollback(() => {
              res.status(500).json({ message: err3.message });
            });
          }

          db.commit((err4) => {
            if (err4) {
              return db.rollback(() => {
                res.status(500).json({ message: err4.message });
              });
            }

            res.status(201).json({
              id: onlineOrderId,
              customer_id: 0,
              subtotal,
              tax,
              total_amount: totalWithTax,
              status: "pending",
            });
          });
        });
      }
    );
  });
});

// GET all online order items (optional)
app.get("/api/online_order_items", (req, res) => {
  const query = `
    SELECT oi.id,
           oi.online_order_id,
           oi.menu_item_id,
           oi.quantity,
           oi.price,
           m.name AS item_name,
           m.category
    FROM online_order_items oi
    JOIN menu_items m ON oi.menu_item_id = m.id
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET items for one online order
app.get("/api/online_orders/:id/items", (req, res) => {
  const onlineOrderId = req.params.id;

  const query = `
    SELECT oi.id,
           oi.online_order_id,
           oi.menu_item_id,
           oi.quantity,
           oi.price,
           m.name AS item_name,
           m.category
    FROM online_order_items oi
    JOIN menu_items m ON oi.menu_item_id = m.id
    WHERE oi.online_order_id = ?
  `;

  db.query(query, [onlineOrderId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// UPDATE items for one online order + recompute totals
app.put("/api/online_orders/:id/items", (req, res) => {
  const onlineOrderId = req.params.id;
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ message: "items array (non-empty) is required" });
  }

  let subtotal = 0;
  items.forEach((it) => {
    subtotal += Number(it.price || 0) * Number(it.quantity || 0);
  });

  const TAX_RATE_ONLINE = 0.11;
  const tax = +(subtotal * TAX_RATE_ONLINE).toFixed(2);
  const totalWithTax = +(subtotal + tax).toFixed(2);

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: err.message });

    const delSql = "DELETE FROM online_order_items WHERE online_order_id = ?";

    db.query(delSql, [onlineOrderId], (errDel) => {
      if (errDel) {
        return db.rollback(() =>
          res.status(500).json({ message: errDel.message })
        );
      }

      const values = items.map((it) => [
        onlineOrderId,
        it.menu_item_id,
        it.quantity,
        it.price,
      ]);

      const insSql = `
        INSERT INTO online_order_items
          (online_order_id, menu_item_id, quantity, price)
        VALUES ?
      `;

      db.query(insSql, [values], (errIns) => {
        if (errIns) {
          return db.rollback(() =>
            res.status(500).json({ message: errIns.message })
          );
        }

        const updOrderSql = `
          UPDATE online_orders
          SET total_amount = ?, tax_amount = ?
          WHERE id = ?
        `;

        db.query(
          updOrderSql,
          [totalWithTax, tax, onlineOrderId],
          (errUpd, result) => {
            if (errUpd) {
              return db.rollback(() =>
                res.status(500).json({ message: errUpd.message })
              );
            }

            if (result.affectedRows === 0) {
              return db.rollback(() =>
                res.status(404).json({ message: "Online order not found" })
              );
            }

            db.commit((errCommit) => {
              if (errCommit) {
                return db.rollback(() =>
                  res.status(500).json({ message: errCommit.message })
                );
              }

              res.json({
                id: Number(onlineOrderId),
                subtotal,
                tax,
                total_amount: totalWithTax,
              });
            });
          }
        );
      });
    });
  });
});

// DELETE one online order + its items
app.delete("/api/online_orders/:id", (req, res) => {
  const { id } = req.params;

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: err.message });

    const delItemsSql =
      "DELETE FROM online_order_items WHERE online_order_id = ?";

    db.query(delItemsSql, [id], (errItems) => {
      if (errItems) {
        return db.rollback(() =>
          res.status(500).json({ message: errItems.message })
        );
      }

      const delOrderSql = "DELETE FROM online_orders WHERE id = ?";

      db.query(delOrderSql, [id], (errOrder, result) => {
        if (errOrder) {
          return db.rollback(() =>
            res.status(500).json({ message: errOrder.message })
          );
        }

        if (result.affectedRows === 0) {
          return db.rollback(() =>
            res.status(404).json({ message: "Online order not found" })
          );
        }

        db.commit((errCommit) => {
          if (errCommit) {
            return db.rollback(() =>
              res.status(500).json({ message: errCommit.message })
            );
          }

          res.json({ message: "Online order deleted", id: Number(id) });
        });
      });
    });
  });
});

// update online order status / payment
app.put("/api/online_orders/:id", (req, res) => {
  const { id } = req.params;
  const { status, payment_status } = req.body;

  const fields = [];
  const values = [];

  if (status) {
    fields.push("status = ?");
    values.push(status);
  }
  if (payment_status) {
    fields.push("payment_status = ?");
    values.push(payment_status);
  }

  if (fields.length === 0) {
    return res
      .status(400)
      .json({ message: "Provide status and/or payment_status to update" });
  }

  const query = `UPDATE online_orders SET ${fields.join(", ")} WHERE id = ?`;
  values.push(id);

  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Online order not found" });
    }
    res.json({ id: Number(id), status, payment_status });
  });
});

app.listen(PORT, () => {
  console.log(`POS backend running on http://localhost:${PORT}`);
});
