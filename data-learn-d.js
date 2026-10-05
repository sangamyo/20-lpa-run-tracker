window.LESSONS = window.LESSONS || [];
window.LESSONS.push(
{
  id: "cs-oop",
  track: "Core CS",
  order: 30,
  week: 2,
  title: "OOP in Python: the four pillars, SOLID and patterns interviewers ask",
  minutes: 60,
  goal: "After this lesson you can explain encapsulation, abstraction, inheritance and polymorphism with Python code, reason about MRO and the diamond problem, apply SOLID, and write Singleton, Factory, Strategy and Observer from memory.",
  why: "Almost every SDE interview in India has an OOP round or OOP questions inside the coding round. Low-level design (parking lot, splitwise, elevator) rounds are graded on how cleanly you use these ideas.",
  sections: [
    {
      h: "Classes and encapsulation with @property",
      p: [
        "A class bundles data (attributes) and behaviour (methods). An object is one instance of that class with its own data.",
        "Encapsulation means the object controls how its data changes. Outsiders call methods; they do not poke at internal state directly.",
        "Python has no real `private`. A single underscore `_balance` means 'internal, please do not touch'. A double underscore `__balance` triggers name mangling to `_BankAccount__balance`, which avoids accidental clashes in subclasses but is not security.",
        "`@property` lets you expose a read-only view or add validation without changing the public API. Callers still write `acc.balance`, but you decide what happens."
      ],
      code: `class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self._balance = balance  # internal by convention

    @property
    def balance(self):
        return self._balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("amount must be positive")
        self._balance += amount


acc = BankAccount("Asha", 100)
acc.deposit(50)
print(acc.balance)

try:
    acc.balance = 1_000_000
except AttributeError:
    print("blocked: balance has no setter")

try:
    acc.deposit(-5)
except ValueError as e:
    print("blocked:", e)`,
      out: `150
blocked: balance has no setter
blocked: amount must be positive`
    },
    {
      h: "Abstraction with abc, and polymorphism",
      p: [
        "Abstraction means callers depend on what an object does, not how. In Python you express this with an abstract base class from the `abc` module.",
        "A class with an `@abstractmethod` cannot be instantiated. Every concrete subclass must implement the method, or it also stays abstract.",
        "Polymorphism means one call, many behaviours. The loop below calls `area()` without caring which shape it has. Python also supports duck typing: any object with an `area()` method would work, even without inheriting from `Shape`.",
        "Method overloading (same name, different parameter lists) does not exist in Python; the last definition wins. Use default arguments or `functools.singledispatch` instead. Overriding (subclass replaces parent method) is what Python does."
      ],
      code: `from abc import ABC, abstractmethod


class Shape(ABC):
    @abstractmethod
    def area(self):
        ...


class Circle(Shape):
    def __init__(self, r):
        self.r = r

    def area(self):
        return round(3.14159 * self.r * self.r, 2)


class Square(Shape):
    def __init__(self, s):
        self.s = s

    def area(self):
        return self.s * self.s


try:
    Shape()
except TypeError:
    print("cannot instantiate abstract class Shape")

for shape in [Circle(1), Square(3)]:
    print(type(shape).__name__, shape.area())`,
      out: `cannot instantiate abstract class Shape
Circle 3.14
Square 9`
    },
    {
      h: "Inheritance, super() and the diamond problem (MRO)",
      p: [
        "Inheritance models an is-a relationship: a `Manager` is an `Employee`. The child reuses and extends parent code.",
        "With multiple inheritance you can get a diamond: `D` inherits from `B` and `C`, and both inherit from `A`. Which `hello()` runs?",
        "Python answers with the Method Resolution Order (MRO), computed by the C3 linearization algorithm. Read it with `D.__mro__`. Rule of thumb: child before parents, parents in the order you listed them, and each class appears once.",
        "`super()` does not mean 'my parent'. It means 'the next class in the MRO of the actual object'. That is why `B`'s `super()` call below goes to `C`, not to `A`, and `A` runs only once."
      ],
      code: `class A:
    def hello(self):
        return "A"


class B(A):
    def hello(self):
        return "B -> " + super().hello()


class C(A):
    def hello(self):
        return "C -> " + super().hello()


class D(B, C):
    def hello(self):
        return "D -> " + super().hello()


print(D().hello())
print([cls.__name__ for cls in D.__mro__])`,
      out: `D -> B -> C -> A
['D', 'B', 'C', 'A', 'object']`
    },
    {
      h: "Composition over inheritance",
      p: [
        "Composition models a has-a relationship: a `Car` has an engine. You pass the part in and delegate to it.",
        "Prefer composition when behaviour needs to change at runtime or when the is-a relationship is shaky. Deep inheritance trees are fragile: a change in a base class silently breaks many children.",
        "Interview line: 'I use inheritance for true is-a relationships with a stable base, and composition for everything else, because it keeps classes small and swappable.'"
      ],
      code: `class Engine:
    def start(self):
        return "engine on"


class ElectricMotor:
    def start(self):
        return "motor humming"


class Car:
    def __init__(self, power_source):
        self.power = power_source  # has-a, not is-a

    def drive(self):
        return self.power.start() + ", car moving"


print(Car(Engine()).drive())
print(Car(ElectricMotor()).drive())`,
      out: `engine on, car moving
motor humming, car moving`
    },
    {
      h: "SOLID in five short lines, plus code",
      p: [
        "S, Single Responsibility: a class has one reason to change. `Invoice` computes totals; `InvoicePrinter` formats them; `InvoiceRepo` saves them.",
        "O, Open/Closed: open for extension, closed for modification. Add a new payment type by adding a class, not by adding another `elif` to a big function.",
        "L, Liskov Substitution: a subclass must work anywhere the parent works. The classic violation is `Square(Rectangle)`; see the worked example below.",
        "I, Interface Segregation: many small interfaces beat one fat one. A `Printer` should not be forced to implement `fax()`.",
        "D, Dependency Inversion: high-level code depends on abstractions, and concrete classes are injected. The `OrderService` below depends on `Notifier`, not on email or SMS directly, so you can pass a fake notifier in tests."
      ],
      code: `from abc import ABC, abstractmethod


class Notifier(ABC):
    @abstractmethod
    def send(self, user, msg):
        ...


class EmailNotifier(Notifier):
    def send(self, user, msg):
        return f"email to {user}: {msg}"


class SmsNotifier(Notifier):
    def send(self, user, msg):
        return f"sms to {user}: {msg}"


class OrderService:
    # Depends on the abstraction (DIP). New channels need no change here (OCP).
    def __init__(self, notifiers):
        self.notifiers = notifiers

    def place_order(self, user, item):
        return [n.send(user, f"order for {item} placed") for n in self.notifiers]


svc = OrderService([EmailNotifier(), SmsNotifier()])
for line in svc.place_order("ravi", "keyboard"):
    print(line)`,
      out: `email to ravi: order for keyboard placed
sms to ravi: order for keyboard placed`
    },
    {
      h: "Design patterns interviewers ask: Singleton, Factory, Strategy, Observer",
      p: [
        "Singleton: exactly one instance (config, connection pool). In Python, override `__new__`, or simply use a module-level object, since modules are imported once. Mention that singletons are global state and make testing harder.",
        "Factory: one function or class decides which concrete class to create, so callers do not import every class. Common for parsers, exporters, payment gateways.",
        "Strategy: swap an algorithm at runtime by passing it in. In Python a strategy can just be a function, because functions are first-class objects.",
        "Observer: subscribers register with a publisher and get notified on events. This is the idea behind event buses, webhooks and pub/sub systems like Kafka topics.",
        "Others worth one line each: Builder (step-by-step construction), Adapter (wrap an incompatible interface), Decorator (add behaviour by wrapping; Python's `@decorator` syntax is a close cousin)."
      ],
      code: `# Singleton
class Config:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.settings = {}
        return cls._instance


a, b = Config(), Config()
a.settings["db"] = "postgres"
print("singleton same object:", a is b, b.settings["db"])


# Factory
class PdfExporter:
    def render(self):
        return "pdf bytes"


class CsvExporter:
    def render(self):
        return "csv rows"


def exporter_factory(kind):
    return {"pdf": PdfExporter, "csv": CsvExporter}[kind]()


print("factory:", exporter_factory("csv").render())


# Strategy
def flat_discount(price):
    return price - 50


def percent_discount(price):
    return price * 0.9


class Checkout:
    def __init__(self, strategy):
        self.strategy = strategy

    def total(self, price):
        return self.strategy(price)


print("strategy:", Checkout(flat_discount).total(500), Checkout(percent_discount).total(500))


# Observer
class EventBus:
    def __init__(self):
        self.subscribers = []

    def subscribe(self, fn):
        self.subscribers.append(fn)

    def publish(self, event):
        for fn in self.subscribers:
            fn(event)


bus = EventBus()
bus.subscribe(lambda e: print("observer email got", e))
bus.subscribe(lambda e: print("observer analytics got", e))
bus.publish("signup:asha")`,
      out: `singleton same object: True postgres
factory: csv rows
strategy: 450 450.0
observer email got signup:asha
observer analytics got signup:asha`
    }
  ],
  example: {
    name: "Classic question: why is Square extends Rectangle a bad design?",
    steps: [
      "State the expectation: code written for `Rectangle` assumes width and height change independently.",
      "Show that `Square` must keep width equal to height, so it overrides `set_width` to change both.",
      "Run a function written for rectangles. With a real rectangle it returns 50. With a square it returns 100. The subclass broke the caller.",
      "Name it: this violates the Liskov Substitution Principle.",
      "Fix: do not inherit. Make both implement a `Shape` interface with `area()`, or make shapes immutable so there is no `set_width` to break."
    ],
    code: `class Rectangle:
    def __init__(self, w, h):
        self.w, self.h = w, h

    def set_width(self, w):
        self.w = w

    def area(self):
        return self.w * self.h


class Square(Rectangle):
    def __init__(self, s):
        super().__init__(s, s)

    def set_width(self, w):
        self.w = self.h = w  # must keep it square


def stretch(rect):
    rect.set_width(10)
    return rect.area()  # caller expects 10 * original height


print("rectangle 2x5 ->", stretch(Rectangle(2, 5)))
print("square 5x5    ->", stretch(Square(5)), "(caller expected 50)")`
  },
  mistakes: [
    "Saying Python has private variables. It only has the underscore convention and name mangling with double underscores.",
    "Claiming Python supports method overloading. Defining a method twice just replaces the first one.",
    "Saying super() calls the parent class. It calls the next class in the MRO of the object, which matters with multiple inheritance.",
    "Using inheritance just to reuse code when there is no is-a relationship, instead of composition.",
    "Listing SOLID letters without a concrete example. Interviewers almost always ask 'give me an example of Open/Closed'.",
    "Writing a Singleton without mentioning its downside: hidden global state that makes tests and concurrency harder."
  ],
  practice: [],
  quiz: [
    {
      q: "class D(B, C) where B and C both inherit A. What is D.__mro__ (by class name)?",
      options: ["D, B, A, C, object", "D, B, C, A, object", "D, C, B, A, object", "D, A, B, C, object"],
      answer: 1,
      why: "C3 linearization puts a class before its parents, keeps the listed order B then C, and places shared base A only after both."
    },
    {
      q: "OrderService takes a list of Notifier objects in its constructor instead of creating EmailNotifier itself. Which principle is this mainly?",
      options: ["Single Responsibility", "Liskov Substitution", "Dependency Inversion", "Interface Segregation"],
      answer: 2,
      why: "High-level code depends on an abstraction and concrete implementations are injected from outside. That is Dependency Inversion (and it enables dependency injection in tests)."
    },
    {
      q: "Which pattern lets you change a discount algorithm at runtime by passing in a different function or object?",
      options: ["Strategy", "Singleton", "Observer", "Factory"],
      answer: 0,
      why: "Strategy encapsulates interchangeable algorithms behind one interface and lets the caller choose which to use."
    }
  ]
},
{
  id: "cs-sql",
  track: "Core CS",
  order: 31,
  week: 3,
  title: "SQL you must write in an interview",
  minutes: 75,
  goal: "After this lesson you can write joins of every type, GROUP BY with HAVING, subqueries and CTEs, window functions for Nth highest salary and top-N per group, and anti-joins, and explain why each works.",
  why: "Backend interviews almost always include 2 to 3 SQL queries on a whiteboard or HackerRank. The same 6 patterns (joins, aggregation, Nth highest, top per group, anti-join, self join) cover most of them.",
  sections: [
    {
      h: "The demo schema and the order SQL actually runs in",
      p: [
        "Every demo below builds the same small company database in SQLite memory so you can run it as is. `departments(id, name)` and `employees(id, name, dept_id, salary, manager_id)`. HR has no employees; Dev has no department.",
        "Logical execution order, which explains many errors: FROM and JOIN, then WHERE, then GROUP BY, then HAVING, then SELECT, then DISTINCT, then ORDER BY, then LIMIT/OFFSET.",
        "That order is why you cannot use a SELECT alias inside WHERE (WHERE runs before SELECT), why aggregate filters go in HAVING, and why ORDER BY can use aliases.",
        "WHERE filters rows before grouping. HAVING filters groups after grouping."
      ],
      code: `import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE employees (
    id INTEGER PRIMARY KEY, name TEXT,
    dept_id INTEGER REFERENCES departments(id),
    salary INTEGER, manager_id INTEGER
);
INSERT INTO departments VALUES (1, 'Eng'), (2, 'Sales'), (3, 'HR');
INSERT INTO employees VALUES
    (1, 'Asha', 1, 120000, NULL), (2, 'Ravi', 1, 90000, 1),
    (3, 'Meena', 1, 90000, 1), (4, 'Karan', 2, 70000, 1),
    (5, 'Zoya', 2, 85000, 4), (6, 'Dev', NULL, 50000, 1);
""")

for row in db.execute("SELECT name, salary FROM employees WHERE salary >= 85000 ORDER BY salary DESC, name"):
    print(row)`,
      out: `('Asha', 120000)
('Meena', 90000)
('Ravi', 90000)
('Zoya', 85000)`
    },
    {
      h: "Joins of every type, including self join",
      p: [
        "INNER JOIN keeps only rows that match on both sides. Dev (no department) and HR (no employees) disappear.",
        "LEFT JOIN keeps every row from the left table; missing right-side columns become NULL. RIGHT JOIN is the same with tables swapped, so most people just write a LEFT JOIN with the tables flipped.",
        "FULL OUTER JOIN keeps unmatched rows from both sides. Newer SQLite and Postgres support it directly; MySQL does not, so the portable answer is LEFT JOIN UNION the unmatched right rows, shown below.",
        "CROSS JOIN is every pair (6 employees x 3 departments = 18 rows). A self join joins a table to itself with two aliases, the standard trick for employee and manager questions.",
        "Put filters on the right table of a LEFT JOIN inside the ON clause. Putting them in WHERE throws away the NULL rows and silently turns it into an INNER JOIN."
      ],
      code: `import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER, manager_id INTEGER);
INSERT INTO departments VALUES (1, 'Eng'), (2, 'Sales'), (3, 'HR');
INSERT INTO employees VALUES
    (1, 'Asha', 1, 120000, NULL), (2, 'Ravi', 1, 90000, 1),
    (3, 'Meena', 1, 90000, 1), (4, 'Karan', 2, 70000, 1),
    (5, 'Zoya', 2, 85000, 4), (6, 'Dev', NULL, 50000, 1);
""")


def show(title, sql):
    print("--", title)
    for row in db.execute(sql):
        print(row)


show("INNER JOIN", """
    SELECT e.name, d.name FROM employees e
    JOIN departments d ON e.dept_id = d.id ORDER BY e.id""")

show("LEFT JOIN: every employee, even without a dept", """
    SELECT e.name, d.name FROM employees e
    LEFT JOIN departments d ON e.dept_id = d.id WHERE d.id IS NULL""")

show("FULL OUTER JOIN emulated with LEFT JOIN + UNION ALL", """
    SELECT e.name, d.name FROM employees e LEFT JOIN departments d ON e.dept_id = d.id
    UNION ALL
    SELECT NULL, d.name FROM departments d LEFT JOIN employees e ON e.dept_id = d.id
    WHERE e.id IS NULL
    ORDER BY 2, 1""")

show("SELF JOIN: employees earning more than their manager", """
    SELECT e.name, e.salary, m.name, m.salary FROM employees e
    JOIN employees m ON e.manager_id = m.id WHERE e.salary > m.salary""")

show("CROSS JOIN row count", "SELECT COUNT(*) FROM employees CROSS JOIN departments")`,
      out: `-- INNER JOIN
('Asha', 'Eng')
('Ravi', 'Eng')
('Meena', 'Eng')
('Karan', 'Sales')
('Zoya', 'Sales')
-- LEFT JOIN: every employee, even without a dept
('Dev', None)
-- FULL OUTER JOIN emulated with LEFT JOIN + UNION ALL
('Dev', None)
('Asha', 'Eng')
('Meena', 'Eng')
('Ravi', 'Eng')
(None, 'HR')
('Karan', 'Sales')
('Zoya', 'Sales')
-- SELF JOIN: employees earning more than their manager
('Zoya', 85000, 'Karan', 70000)
-- CROSS JOIN row count
(18,)`
    },
    {
      h: "GROUP BY, HAVING and the COUNT traps",
      p: [
        "GROUP BY collapses rows into one row per group. Every selected column must be either in the GROUP BY or inside an aggregate (COUNT, SUM, AVG, MIN, MAX). MySQL sometimes lets you break this rule and returns an arbitrary value; do not rely on it.",
        "`COUNT(*)` counts rows. `COUNT(col)` skips NULLs. `COUNT(DISTINCT col)` counts unique non-NULL values. Interviewers love asking the difference.",
        "To count departments with zero employees, LEFT JOIN from departments and use `COUNT(e.id)`, not `COUNT(*)`. `COUNT(*)` would count the NULL row and report 1 for HR.",
        "HAVING filters on aggregates: 'departments with more than 2 employees' needs `HAVING COUNT(*) > 2`. You cannot write that in WHERE."
      ],
      code: `import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER, manager_id INTEGER);
INSERT INTO departments VALUES (1, 'Eng'), (2, 'Sales'), (3, 'HR');
INSERT INTO employees VALUES
    (1, 'Asha', 1, 120000, NULL), (2, 'Ravi', 1, 90000, 1),
    (3, 'Meena', 1, 90000, 1), (4, 'Karan', 2, 70000, 1),
    (5, 'Zoya', 2, 85000, 4), (6, 'Dev', NULL, 50000, 1);
""")

print("-- headcount and average salary per department")
for row in db.execute("""
    SELECT d.name, COUNT(e.id) AS headcount, AVG(e.salary) AS avg_salary
    FROM departments d LEFT JOIN employees e ON e.dept_id = d.id
    GROUP BY d.id ORDER BY d.id"""):
    print(row)

print("-- departments with more than 2 employees")
for row in db.execute("""
    SELECT dept_id, COUNT(*) FROM employees
    WHERE dept_id IS NOT NULL
    GROUP BY dept_id HAVING COUNT(*) > 2"""):
    print(row)

print("-- COUNT(*), COUNT(dept_id), COUNT(DISTINCT salary)")
print(db.execute("SELECT COUNT(*), COUNT(dept_id), COUNT(DISTINCT salary) FROM employees").fetchone())`,
      out: `-- headcount and average salary per department
('Eng', 3, 100000.0)
('Sales', 2, 77500.0)
('HR', 0, None)
-- departments with more than 2 employees
(1, 3)
-- COUNT(*), COUNT(dept_id), COUNT(DISTINCT salary)
(6, 5, 5)`
    },
    {
      h: "Subquery vs CTE (and a recursive CTE)",
      p: [
        "A correlated subquery references the outer row, so conceptually it runs once per outer row. 'Employees earning more than their department average' is the classic example.",
        "A CTE (`WITH name AS (...)`) computes a named intermediate result once and reads like steps. Most interviewers prefer CTEs for anything with more than one level because they are easier to read and debug.",
        "Performance: modern optimizers often rewrite both into the same plan. Say that, and add that a CTE can be referenced multiple times while a subquery must be repeated.",
        "`WITH RECURSIVE` walks hierarchies such as org charts or category trees: a base case (the CEO) UNION ALL a step that joins children to the rows found so far."
      ],
      code: `import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER, manager_id INTEGER);
INSERT INTO employees VALUES
    (1, 'Asha', 1, 120000, NULL), (2, 'Ravi', 1, 90000, 1),
    (3, 'Meena', 1, 90000, 1), (4, 'Karan', 2, 70000, 1),
    (5, 'Zoya', 2, 85000, 4), (6, 'Dev', NULL, 50000, 1);
""")

print("-- correlated subquery")
for row in db.execute("""
    SELECT name, salary FROM employees e
    WHERE salary > (SELECT AVG(salary) FROM employees WHERE dept_id = e.dept_id)
    ORDER BY name"""):
    print(row)

print("-- same thing with a CTE")
for row in db.execute("""
    WITH dept_avg AS (
        SELECT dept_id, AVG(salary) AS avg_sal FROM employees GROUP BY dept_id
    )
    SELECT e.name, e.salary, a.avg_sal
    FROM employees e JOIN dept_avg a ON e.dept_id = a.dept_id
    WHERE e.salary > a.avg_sal ORDER BY e.name"""):
    print(row)

print("-- recursive CTE: reporting levels under the CEO")
for row in db.execute("""
    WITH RECURSIVE chain(id, name, level) AS (
        SELECT id, name, 0 FROM employees WHERE manager_id IS NULL
        UNION ALL
        SELECT e.id, e.name, c.level + 1
        FROM employees e JOIN chain c ON e.manager_id = c.id
    )
    SELECT name, level FROM chain ORDER BY level, id"""):
    print(row)`,
      out: `-- correlated subquery
('Asha', 120000)
('Zoya', 85000)
-- same thing with a CTE
('Asha', 120000, 100000.0)
('Zoya', 85000, 77500.0)
-- recursive CTE: reporting levels under the CEO
('Asha', 0)
('Ravi', 1)
('Meena', 1)
('Karan', 1)
('Dev', 1)
('Zoya', 2)`
    },
    {
      h: "Window functions: ROW_NUMBER, RANK, DENSE_RANK, Nth highest, top per group",
      p: [
        "A window function computes a value across related rows without collapsing them like GROUP BY does. Syntax: `FUNC() OVER (PARTITION BY ... ORDER BY ...)`.",
        "With salaries 120k, 90k, 90k, 85k: ROW_NUMBER gives 1,2,3,4 (always unique). RANK gives 1,2,2,4 (skips after a tie). DENSE_RANK gives 1,2,2,3 (no gaps).",
        "Nth highest salary means Nth distinct value, so use DENSE_RANK. ROW_NUMBER would wrongly return 90k again for N = 3.",
        "Top earner per department: ROW_NUMBER with `PARTITION BY dept_id`, then keep `rn = 1` in an outer query. You cannot filter on a window function in WHERE of the same query, because WHERE runs before SELECT.",
        "Other useful ones: `SUM(x) OVER (ORDER BY day)` for running totals, `LAG`/`LEAD` for comparing with the previous or next row (day-over-day change)."
      ],
      code: `import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary INTEGER, manager_id INTEGER);
INSERT INTO employees VALUES
    (1, 'Asha', 1, 120000, NULL), (2, 'Ravi', 1, 90000, 1),
    (3, 'Meena', 1, 90000, 1), (4, 'Karan', 2, 70000, 1),
    (5, 'Zoya', 2, 85000, 4), (6, 'Dev', NULL, 50000, 1);
""")

print("-- name, salary, row_number, rank, dense_rank")
for row in db.execute("""
    SELECT name, salary,
        ROW_NUMBER() OVER (ORDER BY salary DESC, name) AS rn,
        RANK()       OVER (ORDER BY salary DESC) AS rnk,
        DENSE_RANK() OVER (ORDER BY salary DESC) AS drnk
    FROM employees ORDER BY salary DESC, name"""):
    print(row)

N = 3
nth = db.execute("""
    SELECT DISTINCT salary FROM (
        SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS dr FROM employees
    ) WHERE dr = ?""", (N,)).fetchone()
print("-- 3rd highest distinct salary:", nth)

print("-- top earner per department")
for row in db.execute("""
    SELECT dept_id, name, salary FROM (
        SELECT dept_id, name, salary,
               ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn
        FROM employees WHERE dept_id IS NOT NULL
    ) WHERE rn = 1 ORDER BY dept_id"""):
    print(row)`,
      out: `-- name, salary, row_number, rank, dense_rank
('Asha', 120000, 1, 1, 1)
('Meena', 90000, 2, 2, 2)
('Ravi', 90000, 3, 2, 2)
('Zoya', 85000, 4, 4, 3)
('Karan', 70000, 5, 5, 4)
('Dev', 50000, 6, 6, 5)
-- 3rd highest distinct salary: (85000,)
-- top earner per department
(1, 'Asha', 120000)
(2, 'Zoya', 85000)`
    },
    {
      h: "Anti-join: customers with no orders (and the NOT IN NULL trap)",
      p: [
        "An anti-join returns rows from A that have no match in B. Three ways: LEFT JOIN plus `WHERE b.id IS NULL`, `NOT EXISTS`, and `NOT IN`.",
        "LEFT JOIN and NOT EXISTS are safe. In the LEFT JOIN version, check a column that can never be NULL in a real match, usually the primary key of B.",
        "NOT IN is dangerous: if the subquery returns even one NULL, `x NOT IN (..., NULL)` is never true, so you get zero rows. The demo has one order with a NULL customer_id to show it.",
        "Default answer in interviews: NOT EXISTS, and mention the NULL trap with NOT IN. That one sentence earns real points."
      ],
      code: `import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount INTEGER);
INSERT INTO customers VALUES (1, 'Asha'), (2, 'Ravi'), (3, 'Meena'), (4, 'Karan');
INSERT INTO orders VALUES (1, 1, 500), (2, 1, 300), (3, 3, 700), (4, NULL, 100);
""")


def names(sql):
    return [row[0] for row in db.execute(sql)]


print("LEFT JOIN anti-join:", names("""
    SELECT c.name FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    WHERE o.id IS NULL ORDER BY c.id"""))

print("NOT EXISTS        :", names("""
    SELECT name FROM customers c
    WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)
    ORDER BY id"""))

print("NOT IN (NULL trap):", names("""
    SELECT name FROM customers
    WHERE id NOT IN (SELECT customer_id FROM orders)"""))

print("NOT IN fixed      :", names("""
    SELECT name FROM customers
    WHERE id NOT IN (SELECT customer_id FROM orders WHERE customer_id IS NOT NULL)
    ORDER BY id"""))`,
      out: `LEFT JOIN anti-join: ['Ravi', 'Karan']
NOT EXISTS        : ['Ravi', 'Karan']
NOT IN (NULL trap): []
NOT IN fixed      : ['Ravi', 'Karan']`
    }
  ],
  template: `-- Top N per group
SELECT * FROM (
    SELECT t.*, ROW_NUMBER() OVER (PARTITION BY group_col ORDER BY sort_col DESC) AS rn
    FROM my_table t
) WHERE rn <= N;

-- Nth highest distinct value
SELECT DISTINCT val FROM (
    SELECT val, DENSE_RANK() OVER (ORDER BY val DESC) AS dr FROM my_table
) WHERE dr = N;

-- Rows in A with no match in B
SELECT a.* FROM a WHERE NOT EXISTS (SELECT 1 FROM b WHERE b.a_id = a.id);`,
  example: {
    name: "Classic question: find the second highest salary, return NULL if there is none",
    steps: [
      "Clarify: second highest distinct salary? Usually yes. With 120k, 90k, 90k the answer is 90k, not 90k again as a third row.",
      "Approach 1: MAX of salaries below the MAX. Simple, works everywhere, but only for N = 2.",
      "Approach 2: `SELECT DISTINCT salary ORDER BY salary DESC LIMIT 1 OFFSET 1`. Generalises to N with OFFSET N-1, but returns no row (not NULL) when there is no answer.",
      "Approach 3: DENSE_RANK in a subquery and filter `dr = N`. Best general answer and handles ties.",
      "To return NULL instead of an empty result, wrap the query as a scalar subquery: `SELECT (subquery) AS second_highest`.",
      "Mention complexity: with an index on salary, the LIMIT/OFFSET version can read just the top of the index."
    ],
    code: `import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, salary INTEGER);
INSERT INTO employees VALUES (1, 'Asha', 120000), (2, 'Ravi', 90000),
    (3, 'Meena', 90000), (4, 'Zoya', 85000);
""")

queries = {
    "max below max": "SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)",
    "limit offset ": "SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1",
    "dense_rank   ": """SELECT DISTINCT salary FROM (
        SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS dr FROM employees
    ) WHERE dr = 2""",
}
for label, q in queries.items():
    print(label, "->", db.execute(q).fetchone())

print("10th highest, plain     ->", db.execute(
    "SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 9").fetchone())
print("10th highest, wrapped   ->", db.execute(
    "SELECT (SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 9)").fetchone())`
  },
  mistakes: [
    "Using ROW_NUMBER for Nth highest salary. Ties make it return a duplicate value; DENSE_RANK is correct for distinct salaries.",
    "Filtering an aggregate in WHERE (`WHERE COUNT(*) > 2`) instead of HAVING.",
    "Using NOT IN with a subquery that can contain NULL, which returns zero rows.",
    "Putting a right-table condition of a LEFT JOIN in WHERE, which silently turns it into an INNER JOIN.",
    "Using COUNT(*) after a LEFT JOIN to count children, which reports 1 instead of 0 for parents with no children.",
    "Selecting non-aggregated columns that are not in GROUP BY."
  ],
  practice: [],
  quiz: [
    {
      q: "Salaries are 100, 90, 90, 80. What does DENSE_RANK() OVER (ORDER BY salary DESC) give for 80?",
      options: ["3", "4", "2", "5"],
      answer: 0,
      why: "DENSE_RANK has no gaps after ties: 100 is 1, both 90s are 2, so 80 is 3. RANK would give 4."
    },
    {
      q: "SELECT name FROM customers WHERE id NOT IN (SELECT customer_id FROM orders) returns nothing, though some customers clearly have no orders. Most likely cause?",
      options: ["orders is empty", "orders.customer_id contains a NULL", "NOT IN needs an index", "customers.id is not a primary key"],
      answer: 1,
      why: "x NOT IN (..., NULL) evaluates to UNKNOWN, never TRUE, so every row is filtered out. Use NOT EXISTS or filter NULLs."
    },
    {
      q: "Which clause runs first in logical query processing?",
      options: ["SELECT", "HAVING", "WHERE", "ORDER BY"],
      answer: 2,
      why: "Order is FROM/JOIN, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, LIMIT. That is why SELECT aliases are not visible in WHERE."
    }
  ]
},
{
  id: "cs-dbms",
  track: "Core CS",
  order: 32,
  week: 4,
  title: "DBMS: keys, normalisation, indexes, transactions and isolation",
  minutes: 90,
  goal: "After this lesson you can define every type of key, normalise a table to 3NF/BCNF, explain how a B+ tree index is used (and when it is not), demonstrate ACID with a rollback, compare isolation levels, implement optimistic locking, and discuss SQL vs NoSQL, CAP, replication and sharding.",
  why: "DBMS is the most asked core subject in Indian product-company interviews after DSA. Index and transaction questions are also the bridge into system design rounds.",
  sections: [
    {
      h: "Keys: super, candidate, primary, alternate, foreign, composite",
      p: [
        "Super key: any set of columns that uniquely identifies a row. `{id}`, `{id, email}` and `{email}` are all super keys of a users table.",
        "Candidate key: a minimal super key (remove any column and it stops being unique). `{id}` and `{email}` are candidate keys; `{id, email}` is not, because it is not minimal.",
        "Primary key: the candidate key you choose. It is unique and NOT NULL, and there is one per table. The other candidate keys are alternate keys, usually enforced with UNIQUE.",
        "Foreign key: a column that must match a primary key in another table, giving referential integrity. Composite key: a key made of two or more columns, like `(student_id, course_id)` in an enrollments table.",
        "Surrogate key (auto id, UUID) vs natural key (email, PAN number): surrogate keys never change, which keeps foreign keys stable. Note that SQLite only enforces foreign keys after `PRAGMA foreign_keys = ON`."
      ],
      code: `import sqlite3

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript("""
CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL);
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount INTEGER CHECK (amount > 0)
);
CREATE TABLE enrollments (
    student_id INTEGER, course_id INTEGER,
    PRIMARY KEY (student_id, course_id)
);
INSERT INTO users VALUES (1, 'a@x.com');
""")

tests = [
    ("duplicate email (alternate key)", "INSERT INTO users VALUES (2, 'a@x.com')"),
    ("order for missing user (foreign key)", "INSERT INTO orders VALUES (1, 99, 100)"),
    ("negative amount (check)", "INSERT INTO orders VALUES (2, 1, -5)"),
    ("valid order", "INSERT INTO orders VALUES (3, 1, 250)"),
    ("same student+course twice (composite key)", "INSERT INTO enrollments VALUES (7, 101), (7, 101)"),
]
for label, sql in tests:
    try:
        db.execute(sql)
        print("OK      ", label)
    except sqlite3.IntegrityError as e:
        print("REJECTED", label, "->", str(e).split(":")[0])`,
      out: `REJECTED duplicate email (alternate key) -> UNIQUE constraint failed
REJECTED order for missing user (foreign key) -> FOREIGN KEY constraint failed
REJECTED negative amount (check) -> CHECK constraint failed
OK       valid order
REJECTED same student+course twice (composite key) -> UNIQUE constraint failed`
    },
    {
      h: "Normalisation: one table walked from 1NF to BCNF",
      p: [
        "Start: `flat(student_id, student_name, course_id, course_name, instructor, instructor_phone)`. The key is `(student_id, course_id)`. The same instructor phone is stored in many rows, which causes anomalies.",
        "Update anomaly: change Rao's phone in one row and forget the others; now the data disagrees with itself (shown below). Insert anomaly: you cannot add a new course until a student enrolls. Delete anomaly: deleting the last student of a course deletes the course info too.",
        "1NF: every cell is atomic, no lists like 'DBMS, OS' in one cell, no repeating groups. Our table already passes.",
        "2NF: 1NF plus no partial dependency, meaning no non-key column depends on only part of a composite key. `student_name` depends only on `student_id`, so move it to `students(student_id, student_name)`. Course columns depend only on `course_id`, so move them to `courses`.",
        "3NF: 2NF plus no transitive dependency (non-key column depending on another non-key column). `course_id -> instructor -> instructor_phone` is transitive, so split `instructors(instructor, phone)`.",
        "BCNF: for every dependency X -> Y, X must be a super key. Classic 3NF-but-not-BCNF case: `(student, subject) -> teacher` and `teacher -> subject`, where `teacher` is not a key. Fix by splitting into `(teacher, subject)` and `(student, teacher)`. Decompositions must be lossless: joining the parts gives back the original rows exactly."
      ],
      code: `import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE flat (student_id INT, student_name TEXT, course_id TEXT,
                   course_name TEXT, instructor TEXT, instructor_phone TEXT);
INSERT INTO flat VALUES
    (1, 'Asha', 'CS101', 'DBMS', 'Rao', '111'),
    (2, 'Ravi', 'CS101', 'DBMS', 'Rao', '111'),
    (1, 'Asha', 'CS102', 'OS', 'Iyer', '222');
""")
# Update anomaly: Rao changes phone, but we only fix one row
db.execute("UPDATE flat SET instructor_phone = '999' WHERE student_id = 1 AND course_id = 'CS101'")
print("flat table, Rao's phones:",
      db.execute("SELECT DISTINCT instructor_phone FROM flat WHERE instructor = 'Rao' ORDER BY 1").fetchall())

db.executescript("""
CREATE TABLE students (student_id INT PRIMARY KEY, student_name TEXT);
CREATE TABLE instructors (instructor TEXT PRIMARY KEY, phone TEXT);
CREATE TABLE courses (course_id TEXT PRIMARY KEY, course_name TEXT, instructor TEXT);
CREATE TABLE enrollments (student_id INT, course_id TEXT, PRIMARY KEY (student_id, course_id));
INSERT INTO students VALUES (1, 'Asha'), (2, 'Ravi');
INSERT INTO instructors VALUES ('Rao', '111'), ('Iyer', '222');
INSERT INTO courses VALUES ('CS101', 'DBMS', 'Rao'), ('CS102', 'OS', 'Iyer');
INSERT INTO enrollments VALUES (1, 'CS101'), (2, 'CS101'), (1, 'CS102');
""")
db.execute("UPDATE instructors SET phone = '999' WHERE instructor = 'Rao'")  # one row, one place
print("3NF tables joined back together:")
for row in db.execute("""
    SELECT s.student_name, c.course_name, i.instructor, i.phone
    FROM enrollments e
    JOIN students s ON s.student_id = e.student_id
    JOIN courses c ON c.course_id = e.course_id
    JOIN instructors i ON i.instructor = c.instructor
    ORDER BY s.student_id, c.course_id"""):
    print(row)`,
      out: `flat table, Rao's phones: [('111',), ('999',)]
3NF tables joined back together:
('Asha', 'DBMS', 'Rao', '999')
('Asha', 'OS', 'Iyer', '222')
('Ravi', 'DBMS', 'Rao', '999')`
    },
    {
      h: "Indexes: B+ trees and EXPLAIN QUERY PLAN",
      p: [
        "Without an index, `WHERE user_id = 42` is a full table scan: O(n) rows read. An index is a separate sorted structure that maps column values to row locations.",
        "Most databases (MySQL InnoDB, Postgres, SQLite) use B+ trees. Internal nodes hold only keys for routing; all data pointers sit in the leaves; leaves are linked left to right. High fan-out (hundreds of keys per node) keeps the tree 3 to 4 levels deep even for millions of rows, so a lookup is a few disk reads, O(log n).",
        "The linked leaves make range queries (`BETWEEN`, `>`, `ORDER BY`) cheap: find the start, then walk sideways. That is why B+ trees beat hash indexes for general use; hash indexes only do equality.",
        "Clustered index: the table rows themselves are stored in index order (InnoDB primary key). Only one per table. Non-clustered (secondary) index: a separate tree whose leaves point to the row or the primary key.",
        "Cost of indexes: every INSERT/UPDATE/DELETE must also update each index, and they take space. Index columns used in WHERE, JOIN and ORDER BY with high selectivity; do not index a boolean column on its own.",
        "Always verify with the query plan. In SQLite, SCAN means reading the whole table; SEARCH ... USING INDEX means the index is used. (Exact wording varies a little by SQLite version; older versions print SCAN TABLE orders.)"
      ],
      code: `import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INT, status TEXT, created_at INT, amount INT)")
db.executemany(
    "INSERT INTO orders (user_id, status, created_at, amount) VALUES (?, ?, ?, ?)",
    [(i % 1000, "paid" if i % 3 else "refunded", i, i % 500) for i in range(20000)],
)


def plan(sql):
    return " | ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql))


q = "SELECT * FROM orders WHERE user_id = 42"
print("before index:", plan(q))
db.execute("CREATE INDEX idx_user ON orders(user_id)")
print("after index :", plan(q))
print("rows found  :", len(db.execute(q).fetchall()))
print("by primary key:", plan("SELECT * FROM orders WHERE id = 7"))`,
      out: `before index: SCAN orders
after index : SEARCH orders USING INDEX idx_user (user_id=?)
rows found  : 20
by primary key: SEARCH orders USING INTEGER PRIMARY KEY (rowid=?)`
    },
    {
      h: "Composite indexes and the leftmost-prefix rule",
      p: [
        "A composite index on `(user_id, status, created_at)` is sorted by user_id, then by status within each user, then by created_at. Think of a phone book sorted by last name, then first name.",
        "Leftmost-prefix rule: the index helps only if the query constrains a leftmost prefix of its columns. `user_id`, `user_id + status`, and all three can use it. `status` alone cannot, just as a phone book cannot find everyone named Ravi.",
        "If you skip a middle column (`user_id` and `created_at` but not `status`), only the `user_id` part is used for seeking.",
        "Put equality columns first and range or sort columns last. A range condition on a column stops the index from seeking on columns after it.",
        "Covering index: if every column the query needs is inside the index, the database never touches the table. SQLite reports this as USING COVERING INDEX."
      ],
      code: `import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INT, status TEXT, created_at INT, amount INT)")
db.executemany(
    "INSERT INTO orders (user_id, status, created_at, amount) VALUES (?, ?, ?, ?)",
    [(i % 1000, "paid" if i % 3 else "refunded", i, i % 500) for i in range(20000)],
)
db.execute("CREATE INDEX idx_usc ON orders(user_id, status, created_at)")


def plan(sql):
    return " | ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql))


queries = [
    "SELECT * FROM orders WHERE user_id = 42",
    "SELECT * FROM orders WHERE user_id = 42 AND status = 'paid'",
    "SELECT * FROM orders WHERE status = 'paid'",
    "SELECT * FROM orders WHERE user_id = 42 AND created_at > 100",
    "SELECT status, created_at FROM orders WHERE user_id = 42",
]
for q in queries:
    print(q.split("WHERE ")[1].ljust(40), "->", plan(q))`,
      out: `user_id = 42                             -> SEARCH orders USING INDEX idx_usc (user_id=?)
user_id = 42 AND status = 'paid'         -> SEARCH orders USING INDEX idx_usc (user_id=? AND status=?)
status = 'paid'                          -> SCAN orders
user_id = 42 AND created_at > 100        -> SEARCH orders USING INDEX idx_usc (user_id=?)
user_id = 42                             -> SEARCH orders USING COVERING INDEX idx_usc (user_id=?)`
    },
    {
      h: "Transactions and ACID, with a real rollback",
      p: [
        "A transaction is a group of statements that succeed or fail together. ACID is what the database promises about it.",
        "Atomicity: all or nothing. Implemented with an undo log or write-ahead log (WAL). Consistency: constraints (keys, CHECK, foreign keys) hold before and after. Isolation: concurrent transactions do not see each other's half-done work (to a configurable degree). Durability: once COMMIT returns, the data survives a crash, because the log was flushed to disk first.",
        "Demo: a bank transfer credits Ravi first and then debits Asha. When the debit breaks the `balance >= 0` CHECK, ROLLBACK undoes the credit as well. Without the transaction, Ravi would have received money that nobody paid.",
        "In application code, use a context manager or try/except that always commits or rolls back. In Python `sqlite3`, `with conn:` commits on success and rolls back on exception."
      ],
      code: `import sqlite3

db = sqlite3.connect(":memory:", isolation_level=None)  # we issue BEGIN/COMMIT ourselves
db.execute("CREATE TABLE accounts (name TEXT PRIMARY KEY, balance INT CHECK (balance >= 0))")
db.execute("INSERT INTO accounts VALUES ('asha', 100), ('ravi', 50)")


def transfer(src, dst, amount):
    try:
        db.execute("BEGIN")
        db.execute("UPDATE accounts SET balance = balance + ? WHERE name = ?", (amount, dst))
        db.execute("UPDATE accounts SET balance = balance - ? WHERE name = ?", (amount, src))
        db.execute("COMMIT")
        print(f"transfer {amount}: committed")
    except sqlite3.IntegrityError:
        db.execute("ROLLBACK")
        print(f"transfer {amount}: rolled back")


def balances():
    return db.execute("SELECT name, balance FROM accounts ORDER BY name").fetchall()


transfer("asha", "ravi", 30)
print(balances())
transfer("asha", "ravi", 500)  # debit would make asha negative
print(balances())`,
      out: `transfer 30: committed
[('asha', 70), ('ravi', 80)]
transfer 500: rolled back
[('asha', 70), ('ravi', 80)]`
    },
    {
      h: "Isolation levels, anomalies and optimistic locking",
      p: [
        "Anomalies. Dirty read: you read data another transaction has not committed (and may roll back). Non-repeatable read: you read the same row twice and get different values because someone committed in between. Phantom read: you rerun a range query and new rows appear. Lost update: two read-modify-write cycles overwrite each other.",
        "Read Uncommitted: dirty, non-repeatable and phantom reads all possible.",
        "Read Committed: no dirty reads; non-repeatable and phantom reads possible. Default in Postgres, Oracle and SQL Server.",
        "Repeatable Read: no dirty or non-repeatable reads; phantoms possible by the SQL standard. Default in MySQL InnoDB, which also blocks most phantoms using MVCC snapshots and gap locks.",
        "Serializable: none of them; result is as if transactions ran one at a time. Safest and slowest, with more aborts or blocking.",
        "Pessimistic locking: lock the row while you work (`SELECT ... FOR UPDATE`). Good when conflicts are frequent. Optimistic locking: no lock; keep a `version` column and update only `WHERE version = the_version_you_read`. If 0 rows changed, someone else won; re-read and retry. Good when conflicts are rare, such as most web apps."
      ],
      code: `import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE products (id INT PRIMARY KEY, stock INT, version INT)")
db.execute("INSERT INTO products VALUES (1, 10, 1)")
db.commit()


def read(pid):
    return db.execute("SELECT stock, version FROM products WHERE id = ?", (pid,)).fetchone()


def buy(pid, qty, seen_stock, seen_version, who):
    cur = db.execute(
        "UPDATE products SET stock = ?, version = version + 1 WHERE id = ? AND version = ?",
        (seen_stock - qty, pid, seen_version),
    )
    db.commit()
    if cur.rowcount == 1:
        print(who, "buys", qty, "-> success")
    else:
        print(who, "buys", qty, "-> conflict, re-read and retry")


# Both users read the row before either one writes
stock_a, ver_a = read(1)
stock_b, ver_b = read(1)
buy(1, 3, stock_a, ver_a, "user A")
buy(1, 4, stock_b, ver_b, "user B")  # stale version -> 0 rows updated
stock_b, ver_b = read(1)
buy(1, 4, stock_b, ver_b, "user B")
print("final (stock, version):", read(1))`,
      out: `user A buys 3 -> success
user B buys 4 -> conflict, re-read and retry
user B buys 4 -> success
final (stock, version): (3, 3)`
    },
    {
      h: "SQL vs NoSQL, CAP, replication and sharding",
      p: [
        "SQL (Postgres, MySQL): fixed schema, joins, strong ACID transactions. Pick it for money, orders, users, anything relational. NoSQL families: key-value (Redis, DynamoDB), document (MongoDB), wide-column (Cassandra), graph (Neo4j). Pick them for flexible schema, huge write volume, or simple access patterns at scale.",
        "CAP theorem: during a network partition (P), a distributed store must choose Consistency (every read sees the latest write, or errors) or Availability (every request gets an answer, possibly stale). Since partitions happen, the real choice is CP (HBase, ZooKeeper, a single-leader SQL setup) or AP (Cassandra, DynamoDB defaults). PACELC adds: Else, when there is no partition, you trade Latency vs Consistency.",
        "Replication: copies of the data on several nodes. Leader-follower: writes go to the leader, reads can go to followers, which may lag (replication lag gives stale reads). Synchronous replication is safer but slower; asynchronous is faster but can lose recent writes on failover.",
        "Sharding (horizontal partitioning): split rows across machines by a shard key, such as user_id. Range sharding keeps ranges together but creates hot spots; hash sharding spreads load evenly. Cross-shard joins and transactions become hard, so choose a key that keeps most queries on one shard.",
        "With `hash(key) % N`, adding one server reshuffles most keys. Consistent hashing places servers on a ring, so only about 1/N of keys move. The demo measures both."
      ],
      code: `import bisect
import zlib

keys = [f"user:{i}" for i in range(10000)]


def mod_shard(key, n):
    return zlib.crc32(key.encode()) % n  # crc32 is stable across runs, unlike hash()


moved = sum(mod_shard(k, 4) != mod_shard(k, 5) for k in keys)
print(f"hash mod N, 4 -> 5 servers: {moved / len(keys):.0%} of keys move")


def build_ring(nodes, vnodes=100):
    return sorted((zlib.crc32(f"{n}#{v}".encode()), n) for n in nodes for v in range(vnodes))


def lookup(ring, key):
    h = zlib.crc32(key.encode())
    i = bisect.bisect(ring, (h,)) % len(ring)  # first node clockwise from the key
    return ring[i][1]


ring4 = build_ring(["A", "B", "C", "D"])
ring5 = build_ring(["A", "B", "C", "D", "E"])
moved = sum(lookup(ring4, k) != lookup(ring5, k) for k in keys)
print(f"consistent hashing, 4 -> 5 servers: {moved / len(keys):.0%} of keys move")`,
      out: `hash mod N, 4 -> 5 servers: 80% of keys move
consistent hashing, 4 -> 5 servers: 22% of keys move`
    }
  ],
  example: {
    name: "Classic question: this query is slow, which index would you add? SELECT * FROM orders WHERE user_id = ? AND status = 'paid' ORDER BY created_at DESC LIMIT 10",
    steps: [
      "Check the plan first. Without a suitable index it scans the whole table and then sorts (USE TEMP B-TREE FOR ORDER BY).",
      "Equality columns go first: `user_id`, then `status`. The sort column goes last: `created_at`.",
      "With index `(user_id, status, created_at)`, the matching rows already sit next to each other in created_at order, so the database walks the index backwards and stops after 10 rows. No sort step.",
      "An index on `(created_at, user_id, status)` would be wrong: the leftmost column is not constrained by equality.",
      "Mention the trade-off: one more index slows writes slightly, which is fine for a read-heavy orders page."
    ],
    code: `import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INT, status TEXT, created_at INT, amount INT)")
db.executemany(
    "INSERT INTO orders (user_id, status, created_at, amount) VALUES (?, ?, ?, ?)",
    [(i % 1000, "paid" if i % 3 else "refunded", i, i % 500) for i in range(20000)],
)
q = "SELECT * FROM orders WHERE user_id = 42 AND status = 'paid' ORDER BY created_at DESC LIMIT 10"


def plan(sql):
    return " | ".join(row[3] for row in db.execute("EXPLAIN QUERY PLAN " + sql))


print("no index      :", plan(q))
db.execute("CREATE INDEX idx_user ON orders(user_id)")
print("user_id only  :", plan(q))
db.execute("CREATE INDEX idx_usc ON orders(user_id, status, created_at)")
print("composite     :", plan(q))
print("first rows    :", db.execute(q).fetchall()[:2])`
  },
  mistakes: [
    "Saying a primary key and a unique key are the same. A primary key is NOT NULL and there is one per table; there can be many unique keys and they may allow NULL.",
    "Claiming an index on (a, b) helps a query that filters only on b. The leftmost-prefix rule says it does not.",
    "Saying 'add an index on every column'. Indexes slow down writes and use space; index based on actual queries.",
    "Mixing up non-repeatable read (same row changed) with phantom read (new rows appear in a range).",
    "Describing CAP as 'pick any two of three'. Partitions are not optional, so the real choice is between C and A during a partition.",
    "Saying Consistency in ACID and Consistency in CAP are the same thing. ACID C is about constraints; CAP C is about all replicas returning the latest write."
  ],
  practice: [],
  quiz: [
    {
      q: "Table R(student, course, teacher) has dependencies (student, course) -> teacher and teacher -> course. Which is true?",
      options: ["It is in BCNF", "It is in 3NF but not BCNF", "It is not even in 2NF", "It is not in 1NF"],
      answer: 1,
      why: "teacher -> course has a determinant that is not a super key, which breaks BCNF. It still passes 3NF because course is part of a candidate key (a prime attribute)."
    },
    {
      q: "Index on (user_id, created_at). Which query can use it to seek?",
      options: ["WHERE created_at > 100", "WHERE user_id = 5 AND created_at > 100", "WHERE amount = 10", "WHERE created_at = 100 OR amount = 10"],
      answer: 1,
      why: "Only queries that constrain the leftmost column (user_id) can seek into this index; created_at can then narrow the range."
    },
    {
      q: "Two users read stock = 10 with version = 1. User A updates WHERE version = 1 and succeeds. User B then runs the same update. What happens with optimistic locking?",
      options: ["B overwrites A's change", "B's update affects 0 rows, so B must re-read and retry", "The database deadlocks", "B waits until A commits"],
      answer: 1,
      why: "A bumped the version to 2, so B's WHERE version = 1 matches nothing. The application detects rowcount 0 and retries with fresh data, preventing a lost update."
    }
  ]
},
{
  id: "cs-os-process",
  track: "Core CS",
  order: 33,
  week: 5,
  title: "OS 1: processes, threads, scheduling and the GIL",
  minutes: 70,
  goal: "After this lesson you can explain process vs thread, process states and context switches, compute waiting and turnaround times for FCFS, SJF and Round Robin, and choose between threads, multiprocessing and asyncio in Python based on the GIL.",
  why: "Process vs thread is the single most asked OS question. For a Python backend role, interviewers then push into the GIL and 'how would you speed this up', which tests whether you understand I/O-bound vs CPU-bound work.",
  sections: [
    {
      h: "Process vs thread",
      p: [
        "A process is a running program with its own address space: code, data, heap, stack, open files. The OS keeps its details in a Process Control Block (PCB): PID, state, program counter, registers, memory maps, open files.",
        "A thread is a unit of execution inside a process. Threads of one process share code, heap, globals and open files, but each thread has its own stack, registers and program counter.",
        "Consequences: threads are cheaper to create and switch, and they communicate through shared memory, which is fast but needs locks. Processes are isolated: a crash or memory bug in one does not corrupt another, and they communicate through IPC (pipes, sockets, shared memory, message queues).",
        "The demo proves the sharing. A thread's change to a global is visible in the main program. A child process gets its own copy, so the parent's value does not change.",
        "On Linux, `fork()` creates a child as a copy of the parent using copy-on-write: pages are shared until one side writes. A zombie is a finished child whose parent has not called `wait()`; an orphan is a child whose parent died (it gets adopted by init/systemd)."
      ],
      code: `import os
import threading
from multiprocessing import Process

counter = {"value": 0}


def bump():
    counter["value"] += 1


if __name__ == "__main__":
    t = threading.Thread(target=bump)
    t.start()
    t.join()
    print("after thread :", counter["value"])  # threads share memory

    p = Process(target=bump)
    p.start()
    p.join()
    print("after process:", counter["value"])  # child changed its own copy
    print("child has a different PID:", p.pid != os.getpid())`,
      out: `after thread : 1
after process: 1
child has a different PID: True`
    },
    {
      h: "Process states and context switching",
      p: [
        "States: New (being created) -> Ready (waiting for a CPU) -> Running -> either back to Ready (preempted by the timer), to Waiting/Blocked (waiting for I/O or a lock), or to Terminated. Waiting goes back to Ready when the I/O completes, never straight to Running.",
        "A context switch saves the running process's registers and program counter into its PCB and loads another's. It is pure overhead: no useful work happens, and caches and the TLB go cold. Switching between threads of the same process is cheaper because the address space (page tables) stays the same.",
        "Triggers: timer interrupt (time slice over), a blocking system call (read from disk or network), or a higher-priority process becoming ready.",
        "User mode vs kernel mode: system calls like `read()` switch the CPU into kernel mode. A mode switch is not the same as a context switch; it does not have to change processes.",
        "Schedulers: the long-term scheduler decides which jobs enter memory, the short-term (CPU) scheduler picks the next ready process many times per second, and the medium-term scheduler swaps processes out under memory pressure."
      ]
    },
    {
      h: "Scheduling algorithms with a worked calculation",
      p: [
        "Definitions. Turnaround time = finish - arrival. Waiting time = turnaround - burst. Response time = first run - arrival.",
        "FCFS (first come first served): simple and non-preemptive, but suffers the convoy effect, where one long job makes many short jobs wait.",
        "SJF (shortest job first): minimum average waiting time among non-preemptive algorithms, but needs burst estimates and can starve long jobs. Its preemptive version is SRTF (shortest remaining time first).",
        "Round Robin with quantum q: each ready process runs at most q units, then goes to the back of the queue. Fair, with good response time; a too-small q means too many context switches, and a too-large q turns into FCFS. Convention used below: processes arriving during a slice join the queue before the preempted process.",
        "Priority scheduling can starve low-priority work; aging (raise priority while waiting) fixes it. Real systems use multilevel feedback queues; Linux uses CFS (Completely Fair Scheduler), which picks the task with the smallest virtual runtime from a red-black tree.",
        "Inputs below: P1(arrival 0, burst 5), P2(1, 3), P3(2, 8), P4(3, 6). Work FCFS by hand: P1 0-5, P2 5-8, P3 8-16, P4 16-22, so waits are 0, 4, 6, 13 and the average is 5.75."
      ],
      code: `from collections import deque

procs = [("P1", 0, 5), ("P2", 1, 3), ("P3", 2, 8), ("P4", 3, 6)]  # (name, arrival, burst)


def report(name, finish):
    waits, tats = [], []
    for pid, arrival, burst in procs:
        tat = finish[pid] - arrival
        tats.append(tat)
        waits.append(tat - burst)
    print(f"{name:5} finish={dict(sorted(finish.items()))} "
          f"avg_wait={sum(waits) / len(waits):.2f} avg_tat={sum(tats) / len(tats):.2f}")


def fcfs():
    t, finish = 0, {}
    for pid, arrival, burst in sorted(procs, key=lambda p: p[1]):
        t = max(t, arrival) + burst
        finish[pid] = t
    return finish


def sjf():  # non-preemptive
    t, finish, left = 0, {}, list(procs)
    while left:
        ready = [p for p in left if p[1] <= t]
        if not ready:
            t = min(p[1] for p in left)
            continue
        p = min(ready, key=lambda p: (p[2], p[1]))
        t += p[2]
        finish[p[0]] = t
        left.remove(p)
    return finish


def round_robin(q):
    t, finish = 0, {}
    remaining = {pid: burst for pid, _, burst in procs}
    pending = sorted(procs, key=lambda p: p[1])
    queue, i = deque(), 0

    def admit(now):
        nonlocal i
        while i < len(pending) and pending[i][1] <= now:
            queue.append(pending[i][0])
            i += 1

    admit(t)
    while len(finish) < len(procs):
        if not queue:
            t = pending[i][1]
            admit(t)
            continue
        pid = queue.popleft()
        run = min(q, remaining[pid])
        t += run
        remaining[pid] -= run
        admit(t)  # new arrivals join before the preempted process
        if remaining[pid] == 0:
            finish[pid] = t
        else:
            queue.append(pid)
    return finish


report("FCFS", fcfs())
report("SJF", sjf())
report("RR q2", round_robin(2))`,
      out: `FCFS  finish={'P1': 5, 'P2': 8, 'P3': 16, 'P4': 22} avg_wait=5.75 avg_tat=11.25
SJF   finish={'P1': 5, 'P2': 8, 'P3': 22, 'P4': 14} avg_wait=5.25 avg_tat=10.75
RR q2 finish={'P1': 14, 'P2': 11, 'P3': 22, 'P4': 20} avg_wait=9.75 avg_tat=15.25`
    },
    {
      h: "The GIL: why threads do not speed up CPU work in Python",
      p: [
        "CPython has a Global Interpreter Lock: only one thread executes Python bytecode at a time, even on an 8-core machine. It exists because CPython's memory management (reference counting) is not thread-safe without it.",
        "So for CPU-bound work (number crunching, parsing, image processing in pure Python), two threads take about as long as one, sometimes longer due to lock contention. Separate processes each have their own interpreter and their own GIL, so they do run in parallel.",
        "The GIL is released during blocking I/O (sockets, files, `time.sleep`) and inside many C extensions (NumPy, hashlib on large inputs). That is why threads still help a lot for I/O-bound work.",
        "The GIL does not make your code thread-safe. `counter += 1` is several bytecodes, and a switch can happen between them. The next lesson demonstrates this.",
        "Python 3.13 added an optional free-threaded build (PEP 703) without the GIL. It is still experimental, so for interviews describe the standard GIL behaviour and mention this as an extra.",
        "Timing numbers below vary by machine, so no expected output is given. Expect threads to be no faster than sequential, and processes to be faster on a multi-core machine."
      ],
      code: `import time
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor


def burn(n):
    total = 0
    for i in range(n):
        total += i * i
    return total


def timed(label, fn):
    start = time.perf_counter()
    fn()
    print(f"{label:22} {time.perf_counter() - start:.2f}s")


if __name__ == "__main__":
    N, WORKERS = 1_500_000, 4
    timed("sequential", lambda: [burn(N) for _ in range(WORKERS)])
    with ThreadPoolExecutor(WORKERS) as pool:
        timed("4 threads (GIL bound)", lambda: list(pool.map(burn, [N] * WORKERS)))
    with ProcessPoolExecutor(WORKERS) as pool:
        pool.submit(burn, 1).result()  # warm up worker processes
        timed("4 processes", lambda: list(pool.map(burn, [N] * WORKERS)))`
    },
    {
      h: "Threads vs multiprocessing vs asyncio",
      p: [
        "CPU-bound (heavy computation): use `multiprocessing` or `ProcessPoolExecutor`. Cost: process start-up and pickling data between processes. Or push the hot loop into NumPy or a C extension.",
        "I/O-bound with blocking libraries (requests, most DB drivers): use `ThreadPoolExecutor`. Threads sleep while waiting for I/O and the GIL is released, so many waits overlap.",
        "I/O-bound with very many connections (thousands of sockets, an API gateway, a chat server): use `asyncio`. One thread runs an event loop; each `await` hands control back while waiting. Coroutines cost a few KB each, while threads each reserve a stack, so asyncio scales to far more concurrent waits.",
        "asyncio rule: never call blocking code (time.sleep, requests.get, heavy CPU) inside a coroutine; it freezes the whole event loop. Use `await asyncio.sleep`, async libraries (httpx, asyncpg), or `asyncio.to_thread` for unavoidable blocking calls.",
        "The demo fakes five 0.2 second network calls. Sequential takes about 1.0s; threads and asyncio take about 0.2s because the waits overlap. Exact times vary."
      ],
      code: `import asyncio
import time
from concurrent.futures import ThreadPoolExecutor


def fetch_blocking(i):
    time.sleep(0.2)  # pretend network call; the GIL is released while sleeping
    return i


async def fetch_async(i):
    await asyncio.sleep(0.2)  # yields to the event loop
    return i


start = time.perf_counter()
[fetch_blocking(i) for i in range(5)]
print(f"sequential: {time.perf_counter() - start:.2f}s")

start = time.perf_counter()
with ThreadPoolExecutor(5) as pool:
    list(pool.map(fetch_blocking, range(5)))
print(f"threads   : {time.perf_counter() - start:.2f}s")


async def main():
    return await asyncio.gather(*(fetch_async(i) for i in range(5)))


start = time.perf_counter()
asyncio.run(main())
print(f"asyncio   : {time.perf_counter() - start:.2f}s")`
    }
  ],
  example: {
    name: "Classic question: an API endpoint calls 3 slow downstream services one after another. How do you make it faster?",
    steps: [
      "Identify the workload: waiting on the network is I/O-bound, so the GIL is not the bottleneck.",
      "Check that the three calls are independent (none needs another's result). If so, run them concurrently.",
      "In an async framework like FastAPI, use an async HTTP client and `asyncio.gather`; total time becomes max(latencies) instead of their sum.",
      "In a sync framework like Django or Flask, use a `ThreadPoolExecutor` to get the same effect.",
      "Add a timeout per call and decide what to do on partial failure (`return_exceptions=True`, fallbacks, circuit breaker).",
      "Do not reach for multiprocessing here: there is no CPU work to parallelise, and process overhead would only add latency."
    ],
    code: `import asyncio
import time


async def call_service(name, delay):
    await asyncio.sleep(delay)  # stands in for an HTTP call
    return f"{name}:ok"


async def handler():
    return await asyncio.gather(
        call_service("users", 0.3),
        call_service("orders", 0.2),
        call_service("prices", 0.1),
    )


start = time.perf_counter()
results = asyncio.run(handler())
elapsed = time.perf_counter() - start
print("results:", results)  # gather keeps argument order
print("took about max(0.3, 0.2, 0.1), not the sum 0.6:", elapsed < 0.5)`
  },
  mistakes: [
    "Saying threads have separate memory. Threads share the heap and globals; only the stack and registers are per thread.",
    "Saying Python threads are useless. They are effective for I/O-bound work because the GIL is released during blocking I/O.",
    "Claiming the GIL makes Python code thread-safe. Compound operations like `x += 1` can still interleave.",
    "Saying SJF is optimal without the condition: it minimises average waiting time only when burst times are known, and it can starve long jobs.",
    "Calling `time.sleep` or a blocking HTTP library inside an async def function, which blocks the entire event loop.",
    "Confusing concurrency (making progress on many tasks by interleaving) with parallelism (running at the same instant on multiple cores)."
  ],
  practice: [],
  quiz: [
    {
      q: "Which of these is NOT shared between threads of the same process?",
      options: ["Heap", "Global variables", "Stack", "Open file descriptors"],
      answer: 2,
      why: "Each thread has its own stack (plus registers and program counter). Heap, globals and open files belong to the process and are shared."
    },
    {
      q: "You need to resize 10,000 images using pure-Python code on an 8-core server. Best choice?",
      options: ["threading", "asyncio", "multiprocessing / ProcessPoolExecutor", "a single loop"],
      answer: 2,
      why: "The work is CPU-bound, so the GIL stops threads and asyncio from using multiple cores. Separate processes each get their own GIL."
    },
    {
      q: "Processes P1 (arrival 0, burst 4) and P2 (arrival 0, burst 2), FCFS order P1 then P2. Average waiting time?",
      options: ["1", "2", "3", "4"],
      answer: 1,
      why: "P1 waits 0 and P2 waits 4 (it starts when P1 finishes), so the average is (0 + 4) / 2 = 2. SJF would run P2 first and give (0 + 2) / 2 = 1."
    }
  ]
},
{
  id: "cs-os-sync",
  track: "Core CS",
  order: 34,
  week: 5,
  title: "OS 2: race conditions, locks, deadlock",
  minutes: 60,
  goal: "After this lesson you can show a race condition, fix it with a lock, use semaphores and queues for producer-consumer, state the four deadlock conditions, prevent deadlock with lock ordering, and run the Banker's algorithm safety check.",
  why: "Concurrency questions separate people who memorised definitions from people who have debugged real bugs. Backend services are concurrent by default, so interviewers expect you to spot races and deadlocks in code.",
  sections: [
    {
      h: "Race condition: when two threads interleave",
      p: [
        "A race condition happens when the result depends on the timing of threads touching shared data. `balance = balance + 1` is really three steps: read, add, write. If two threads both read 5, both write 6, and one deposit is lost.",
        "The code between read and write is the critical section. Only one thread may be inside it at a time.",
        "The demo makes the race easy to see by calling `time.sleep(0)` between the read and the write, which invites the OS to switch threads exactly there. Real races are rarer and appear under load, which is what makes them nasty.",
        "The final number changes from run to run, so no expected output is given. It will be far below 4000."
      ],
      code: `import threading
import time

balance = 0


def deposit_unsafe(times):
    global balance
    for _ in range(times):
        current = balance        # read
        time.sleep(0)            # let another thread run right here
        balance = current + 1    # write, possibly overwriting someone else's update


threads = [threading.Thread(target=deposit_unsafe, args=(1000,)) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print("expected 4000, got", balance)`
    },
    {
      h: "Fixing it with a mutex (Lock)",
      p: [
        "A mutex (mutual exclusion lock) lets one thread at a time into the critical section. In Python use `threading.Lock` with a `with` block so it is always released, even if an exception is raised.",
        "A correct critical-section solution needs three properties: mutual exclusion (one thread inside at a time), progress (if nobody is inside, someone waiting can enter), and bounded waiting (nobody waits forever).",
        "Keep critical sections short. Do slow work (network calls, file I/O) outside the lock, or every other thread queues behind it.",
        "`threading.RLock` (re-entrant lock) can be acquired again by the thread that already holds it. Use it when a locked method calls another locked method on the same object.",
        "Spinlocks busy-wait instead of sleeping. They make sense only in kernels or for very short waits on multi-core machines."
      ],
      code: `import threading
import time

balance = 0
lock = threading.Lock()


def deposit_safe(times):
    global balance
    for _ in range(times):
        with lock:               # only one thread can be between read and write
            current = balance
            time.sleep(0)
            balance = current + 1


threads = [threading.Thread(target=deposit_safe, args=(1000,)) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print("expected 4000, got", balance)`,
      out: `expected 4000, got 4000`
    },
    {
      h: "Semaphores: limiting how many can enter",
      p: [
        "A counting semaphore holds a number of permits. `acquire()` takes one (waiting if none are left) and `release()` returns one. With 2 permits, at most 2 threads run the guarded section at a time.",
        "Use cases: a connection pool of size N, limiting concurrent calls to a rate-limited API, or bounding parallel downloads.",
        "A binary semaphore (1 permit) looks like a mutex, but there is a key difference: a mutex has an owner and only the owner may unlock it, while any thread may release a semaphore. That makes semaphores suitable for signalling between threads.",
        "The classic definitions are P/wait (decrement, block if it would go below zero) and V/signal (increment, wake a waiter)."
      ],
      code: `import threading
import time

pool = threading.Semaphore(2)  # like a DB connection pool of size 2
stats_lock = threading.Lock()
running = 0
max_running = 0


def query(i):
    global running, max_running
    with pool:
        with stats_lock:
            running += 1
            max_running = max(max_running, running)
        time.sleep(0.05)  # pretend to use the connection
        with stats_lock:
            running -= 1


threads = [threading.Thread(target=query, args=(i,)) for i in range(6)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print("max queries running at once:", max_running)`,
      out: `max queries running at once: 2`
    },
    {
      h: "Producer-consumer with queue.Queue",
      p: [
        "Producer-consumer (bounded buffer): producers put items in a fixed-size buffer, consumers take them out. Producers must wait when the buffer is full; consumers must wait when it is empty.",
        "The textbook solution uses one mutex plus two semaphores (`empty` slots and `full` slots), or a mutex with condition variables.",
        "In Python, `queue.Queue(maxsize=n)` already does all of that internally: `put()` blocks when full and `get()` blocks when empty. In an interview, say you would use it in production, then show you know what it does underneath.",
        "To stop consumers cleanly, send a sentinel value such as `None`, one per consumer. The same pattern scales to real systems: a web server pushing jobs onto Redis or Kafka for worker processes."
      ],
      code: `import queue
import threading

buffer = queue.Queue(maxsize=2)  # small buffer so the producer has to wait sometimes
results = []


def producer():
    for n in range(1, 6):
        buffer.put(n)        # blocks while the buffer is full
    buffer.put(None)         # sentinel: no more work


def consumer():
    while True:
        item = buffer.get()  # blocks while the buffer is empty
        if item is None:
            break
        results.append(item * item)


threads = [threading.Thread(target=producer), threading.Thread(target=consumer)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print("consumed squares:", results)`,
      out: `consumed squares: [1, 4, 9, 16, 25]`
    },
    {
      h: "Deadlock: four conditions and lock ordering",
      p: [
        "Deadlock: a set of threads each wait for a resource held by another thread in the set, so none can move.",
        "All four Coffman conditions must hold at once: (1) mutual exclusion, where a resource can be held by only one thread; (2) hold and wait, where a thread holds one resource while waiting for another; (3) no preemption, where resources cannot be forcibly taken away; (4) circular wait, where T1 waits for T2 and T2 waits for T1.",
        "Prevention breaks one condition. The practical one is breaking circular wait: every thread acquires locks in the same global order (for example, by account id). Others: acquire all locks at once, or use `acquire(timeout=...)`, back off and retry.",
        "Avoidance (Banker's algorithm) only grants a request if the system stays in a safe state. Detection plus recovery lets deadlocks happen, finds cycles in a wait-for graph, and kills or rolls back a victim. Databases do this: they detect the cycle and abort one transaction.",
        "Related terms: livelock (threads keep reacting to each other and make no progress, like two people stepping aside in a corridor) and starvation (a thread never gets the resource because others keep winning).",
        "The demo uses `acquire(timeout=0.5)` so that the deadlock is reported instead of hanging forever."
      ],
      code: `import threading
import time


def run(order_t1, order_t2):
    results = {}

    def worker(name, first, second):
        with first:
            time.sleep(0.1)  # make sure both threads grab their first lock
            got = second.acquire(timeout=0.5)
            results[name] = "got both" if got else "stuck -> deadlock"
            if got:
                second.release()
            else:
                while len(results) < 2:  # keep holding our lock until the other thread has tried too
                    time.sleep(0.01)

    t1 = threading.Thread(target=worker, args=("T1", *order_t1))
    t2 = threading.Thread(target=worker, args=("T2", *order_t2))
    t1.start()
    t2.start()
    t1.join()
    t2.join()
    return dict(sorted(results.items()))


a, b = threading.Lock(), threading.Lock()
print("opposite order:", run((a, b), (b, a)))
print("same order    :", run((a, b), (a, b)))`,
      out: `opposite order: {'T1': 'stuck -> deadlock', 'T2': 'stuck -> deadlock'}
same order    : {'T1': 'got both', 'T2': 'got both'}`
    },
    {
      h: "Banker's algorithm (safety check)",
      p: [
        "Each process declares its maximum need up front. Need = Max - Allocation. Work starts as Available.",
        "Repeatedly find a process whose Need fits in Work. Pretend it runs to completion and releases its allocation: Work += Allocation. Mark it finished.",
        "If every process can finish in some order, the state is safe and that order is a safe sequence. If you get stuck, the state is unsafe (deadlock is possible, not certain).",
        "To decide on a request: pretend to grant it, run the safety check, and roll back if the result is unsafe. Cost is O(m x n^2) for m resource types and n processes, and it needs maximum needs known in advance, so real operating systems rarely use it. It is still a favourite theory question.",
        "Data below is the standard textbook example with resources A, B, C."
      ],
      code: `available = [3, 3, 2]
allocation = {"P0": [0, 1, 0], "P1": [2, 0, 0], "P2": [3, 0, 2], "P3": [2, 1, 1], "P4": [0, 0, 2]}
maximum    = {"P0": [7, 5, 3], "P1": [3, 2, 2], "P2": [9, 0, 2], "P3": [2, 2, 2], "P4": [4, 3, 3]}
need = {p: [m - a for m, a in zip(maximum[p], allocation[p])] for p in allocation}


def safe_sequence():
    work, done, order = available[:], set(), []
    progress = True
    while progress:
        progress = False
        for p in allocation:
            if p not in done and all(n <= w for n, w in zip(need[p], work)):
                work = [w + a for w, a in zip(work, allocation[p])]
                done.add(p)
                order.append(p)
                progress = True
    return order if len(done) == len(allocation) else None


print("need:", need)
print("safe sequence:", safe_sequence())`,
      out: `need: {'P0': [7, 4, 3], 'P1': [1, 2, 2], 'P2': [6, 0, 0], 'P3': [0, 1, 1], 'P4': [4, 3, 1]}
safe sequence: ['P1', 'P3', 'P4', 'P0', 'P2']`
    }
  ],
  example: {
    name: "Classic question: print numbers 1 to 10 using two threads, one printing odd and one printing even, strictly alternating",
    steps: [
      "Two threads need to take turns, so they need signalling, not just mutual exclusion.",
      "Use two semaphores: `odd_turn` starts at 1 (odd goes first) and `even_turn` starts at 0.",
      "The odd thread waits on `odd_turn`, prints, then releases `even_turn`. The even thread does the mirror image.",
      "Each thread can only proceed after the other signals it, so the output strictly alternates no matter how the OS schedules them.",
      "Alternative: one `threading.Condition` with a shared `turn` variable and `wait_for(lambda: turn == me)`."
    ],
    code: `import threading

odd_turn = threading.Semaphore(1)
even_turn = threading.Semaphore(0)
out = []


def odd():
    for n in range(1, 11, 2):
        odd_turn.acquire()
        out.append(n)
        even_turn.release()


def even():
    for n in range(2, 11, 2):
        even_turn.acquire()
        out.append(n)
        odd_turn.release()


threads = [threading.Thread(target=even), threading.Thread(target=odd)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print(*out)`
  },
  mistakes: [
    "Saying a binary semaphore and a mutex are identical. A mutex has ownership; a semaphore can be released by any thread and is used for signalling.",
    "Thinking `x += 1` is atomic in Python because of the GIL. It is several bytecodes and can be interrupted between them.",
    "Listing only some of the four deadlock conditions, or saying any one of them causes deadlock. All four must hold together.",
    "Holding a lock while making a network call or doing slow I/O, which serialises the whole service.",
    "Saying an unsafe state means deadlock. Unsafe means deadlock is possible, not that it has happened.",
    "Forgetting to release a lock on the exception path. Use `with lock:` instead of manual acquire and release."
  ],
  practice: [],
  quiz: [
    {
      q: "Every thread acquires locks in increasing order of account id. Which deadlock condition does this break?",
      options: ["Mutual exclusion", "Hold and wait", "No preemption", "Circular wait"],
      answer: 3,
      why: "With a global order, a cycle of waiting threads is impossible, because nobody can wait for a lower-numbered lock while holding a higher one."
    },
    {
      q: "Which tool fits limiting a service to at most 5 concurrent calls to a payment API?",
      options: ["threading.Lock", "threading.Semaphore(5)", "threading.RLock", "threading.Event"],
      answer: 1,
      why: "A counting semaphore with 5 permits lets up to 5 threads in at once and makes the rest wait."
    },
    {
      q: "Two threads each run counter += 1 a million times without a lock. What is the most accurate statement?",
      options: ["The result is always 2,000,000 because of the GIL", "The result can be less than 2,000,000", "The program always crashes", "The result is always exactly 1,000,000"],
      answer: 1,
      why: "The read-add-write sequence can be interrupted between steps, so updates can be lost. How often depends on the Python version and timing, but correctness is not guaranteed."
    }
  ]
},
{
  id: "cs-os-memory",
  track: "Core CS",
  order: 35,
  week: 6,
  title: "OS 3: memory, paging, virtual memory",
  minutes: 60,
  goal: "After this lesson you can translate a virtual address to a physical one with a page table, compute effective access time with a TLB, simulate FIFO, LRU and Optimal page replacement (including Belady's anomaly), explain thrashing, and describe stack vs heap.",
  why: "Paging and page replacement are standard OS theory questions, and LRU leads straight into the most asked design-a-data-structure problem: implement an LRU cache.",
  sections: [
    {
      h: "Logical vs physical addresses, and why virtual memory exists",
      p: [
        "Every process sees its own logical (virtual) address space starting near 0. The MMU (memory management unit) hardware translates each virtual address to a physical RAM address on every access.",
        "Benefits: isolation (a process cannot touch another's memory), the illusion of more memory than RAM (unused pages live on disk), and easy sharing (two processes map the same physical page, for example a shared library).",
        "Contiguous allocation suffers external fragmentation: free memory exists but in pieces too small to use. Paging fixes this by splitting memory into fixed-size blocks.",
        "Paging splits virtual memory into pages and physical memory into frames of the same size (commonly 4 KB). No external fragmentation, but some internal fragmentation: the last page of a region is partly empty.",
        "Segmentation splits memory into variable-size logical segments (code, data, stack). It matches how programmers think but brings external fragmentation back. x86-64 operating systems mostly rely on paging."
      ]
    },
    {
      h: "Page table translation, computed",
      p: [
        "With 4 KB pages (2^12 bytes), the low 12 bits of an address are the offset inside the page and the remaining high bits are the virtual page number (VPN).",
        "Translation: look up the VPN in the page table to get a frame number, then physical address = frame x page size + offset. The offset never changes.",
        "If the page table entry is marked not present, the hardware raises a page fault and the OS takes over.",
        "Size problem: a 32-bit address space with 4 KB pages has 2^20 pages. At 4 bytes per entry that is 4 MB of page table per process, mostly unused. Multi-level page tables (x86-64 uses 4 or 5 levels) allocate only the parts that are actually used. Inverted page tables keep one entry per physical frame instead."
      ],
      code: `PAGE_SIZE = 4096
OFFSET_BITS = 12
page_table = {0: 5, 1: 9, 2: None, 3: 2}  # VPN -> frame number (None = not in RAM)


def translate(vaddr):
    vpn = vaddr >> OFFSET_BITS
    offset = vaddr & (PAGE_SIZE - 1)
    frame = page_table.get(vpn)
    if frame is None:
        return f"vaddr {vaddr:#07x}: vpn={vpn} offset={offset} -> PAGE FAULT"
    paddr = (frame << OFFSET_BITS) | offset
    return f"vaddr {vaddr:#07x}: vpn={vpn} offset={offset} -> frame {frame} -> paddr {paddr:#07x}"


for v in [0x0ABC, 0x1004, 0x2FFF, 0x3010]:
    print(translate(v))

entries = 2 ** (32 - OFFSET_BITS)
print(f"single-level table, 32-bit: {entries:,} entries x 4 B = {entries * 4 // 2 ** 20} MB per process")`,
      out: `vaddr 0x00abc: vpn=0 offset=2748 -> frame 5 -> paddr 0x05abc
vaddr 0x01004: vpn=1 offset=4 -> frame 9 -> paddr 0x09004
vaddr 0x02fff: vpn=2 offset=4095 -> PAGE FAULT
vaddr 0x03010: vpn=3 offset=16 -> frame 2 -> paddr 0x02010
single-level table, 32-bit: 1,048,576 entries x 4 B = 4 MB per process`
    },
    {
      h: "TLB and effective access time",
      p: [
        "The page table lives in RAM, so without help every memory access would cost two accesses: one for the page table entry and one for the data.",
        "The TLB (translation lookaside buffer) is a small, very fast cache of recent VPN to frame translations inside the CPU. Thanks to locality, hit ratios above 99% are normal.",
        "Effective access time (single-level table): EAT = h x (TLB + mem) + (1 - h) x (TLB + 2 x mem). With TLB = 10 ns and memory = 100 ns, see how the hit ratio changes the result below.",
        "A context switch to another process usually flushes the TLB (unless entries are tagged with an address-space id), which is one reason context switches are expensive.",
        "Page fault cost dominates everything: servicing a fault from disk takes milliseconds, about 100,000 times slower than RAM. Even a fault rate of 1 in 100,000 accesses can double the effective access time."
      ],
      code: `TLB_NS, MEM_NS = 10, 100

for hit in [0.80, 0.90, 0.99]:
    eat = hit * (TLB_NS + MEM_NS) + (1 - hit) * (TLB_NS + 2 * MEM_NS)
    print(f"TLB hit ratio {hit:.2f} -> effective access time {eat:.1f} ns")

FAULT_NS = 8_000_000  # 8 ms to service a page fault from disk
for p in [0, 1e-6, 1e-5]:
    eat = (1 - p) * MEM_NS + p * FAULT_NS
    print(f"page fault rate {p:g} -> {eat:.0f} ns per access")`,
      out: `TLB hit ratio 0.80 -> effective access time 130.0 ns
TLB hit ratio 0.90 -> effective access time 120.0 ns
TLB hit ratio 0.99 -> effective access time 111.0 ns
page fault rate 0 -> 100 ns per access
page fault rate 1e-06 -> 108 ns per access
page fault rate 1e-05 -> 180 ns per access`
    },
    {
      h: "Page faults and page replacement: FIFO, LRU, Optimal",
      p: [
        "On a page fault the OS finds the page on disk, picks a free frame (or evicts a victim page, writing it back first if it is dirty), loads the page, updates the page table, and restarts the instruction. Demand paging loads pages only when first touched.",
        "FIFO evicts the page that has been in memory longest. Simple, but it can evict a page that is used constantly.",
        "LRU evicts the page not used for the longest time. It approximates the future using the recent past and works well thanks to locality. Exact LRU is costly in hardware, so real kernels use approximations such as the clock (second-chance) algorithm with a reference bit.",
        "Optimal (Belady's MIN) evicts the page whose next use is farthest in the future. It is impossible in practice because it needs the future, but it is the benchmark other algorithms are compared against.",
        "Belady's anomaly: with FIFO, giving more frames can cause more faults. The reference string 1,2,3,4,1,2,5,1,2,3,4,5 gives 9 faults with 3 frames but 10 with 4. LRU and Optimal are stack algorithms and never show this anomaly."
      ],
      code: `from collections import OrderedDict


def fifo(refs, frames):
    mem, order, faults = set(), [], 0
    for p in refs:
        if p not in mem:
            faults += 1
            if len(mem) == frames:
                mem.remove(order.pop(0))
            mem.add(p)
            order.append(p)
    return faults


def lru(refs, frames):
    mem, faults = OrderedDict(), 0
    for p in refs:
        if p in mem:
            mem.move_to_end(p)            # most recently used goes to the end
        else:
            faults += 1
            if len(mem) == frames:
                mem.popitem(last=False)   # evict least recently used
            mem[p] = True
    return faults


def optimal(refs, frames):
    mem, faults = [], 0
    for i, p in enumerate(refs):
        if p in mem:
            continue
        faults += 1
        if len(mem) == frames:
            future = refs[i + 1:]
            victim = max(mem, key=lambda q: future.index(q) if q in future else len(future))
            mem.remove(victim)
        mem.append(p)
    return faults


belady = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
textbook = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1]
for name, refs in [("belady string", belady), ("textbook string", textbook)]:
    for frames in (3, 4):
        print(f"{name}, {frames} frames: FIFO={fifo(refs, frames)} "
              f"LRU={lru(refs, frames)} OPT={optimal(refs, frames)}")`,
      out: `belady string, 3 frames: FIFO=9 LRU=10 OPT=7
belady string, 4 frames: FIFO=10 LRU=8 OPT=6
textbook string, 3 frames: FIFO=15 LRU=12 OPT=9
textbook string, 4 frames: FIFO=10 LRU=8 OPT=8`
    },
    {
      h: "Thrashing and the working set",
      p: [
        "Thrashing: the system spends more time swapping pages in and out than running programs. CPU utilisation drops, the scheduler sees idle CPU, admits more processes, and things get even worse.",
        "Cause: the combined working sets (pages each process is actively using right now) do not fit in RAM.",
        "Fixes: reduce the degree of multiprogramming (suspend or swap out whole processes), add RAM, or use working-set or page-fault-frequency control, which gives a process more frames when its fault rate is high and takes frames back when it is low.",
        "Backend version of the same idea: a database whose hot data no longer fits in its buffer pool suddenly gets many times slower. A cache with a hit ratio that collapses behaves the same way."
      ]
    },
    {
      h: "Stack vs heap",
      p: [
        "Stack: one per thread, holds function call frames (local variables, return addresses). Allocation is just moving a pointer, so it is very fast and memory is freed automatically when the function returns. It is small (often 8 MB on Linux for the main thread), so deep recursion overflows it.",
        "Heap: shared by all threads in the process, holds dynamically allocated objects that outlive a single call. Slower to allocate, can fragment, and must be freed manually (C), by garbage collection (Java), or by reference counting plus a cycle collector (CPython).",
        "In CPython, every object (ints, lists, your class instances) lives on the heap; the C stack holds interpreter frames and references. Python guards against C stack overflow with a recursion limit (1000 by default) and raises RecursionError.",
        "Memory leak in a garbage-collected language: objects that stay reachable by accident, like an ever-growing global dict used as a cache without eviction."
      ],
      code: `import sys


def depth(n):
    try:
        return depth(n + 1)
    except RecursionError:
        return n


print("recursion limit:", sys.getrecursionlimit())
print("RecursionError raised before depth 1000:", depth(0) < 1000)

a = [1, 2, 3]
b = a           # second reference to the same heap object, not a copy
b.append(4)
print("a sees b's change (same heap object):", a, a is b)`,
      out: `recursion limit: 1000
RecursionError raised before depth 1000: True
a sees b's change (same heap object): [1, 2, 3, 4] True`
    }
  ],
  example: {
    name: "Classic question: design an LRU cache with O(1) get and put (LeetCode 146)",
    steps: [
      "Need O(1) lookup by key: a hash map.",
      "Need O(1) 'move to most recent' and 'evict least recent': a doubly linked list ordered by recency, with the map pointing to list nodes.",
      "get(key): if missing return -1; otherwise move the node to the most-recent end and return its value.",
      "put(key, value): update or insert at the most-recent end; if size exceeds capacity, remove from the least-recent end and delete that key from the map.",
      "In Python, `OrderedDict` is exactly a hash map plus a doubly linked list, with `move_to_end` and `popitem(last=False)` in O(1). Say that, then offer to write the manual node version if the interviewer wants it.",
      "Link it back to OS: this is the same policy as LRU page replacement, and the same structure used in database buffer pools and Redis eviction (approximate LRU)."
    ],
    code: `from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = OrderedDict()

    def get(self, key):
        if key not in self.data:
            return -1
        self.data.move_to_end(key)
        return self.data[key]

    def put(self, key, value):
        if key in self.data:
            self.data.move_to_end(key)
        self.data[key] = value
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)


cache = LRUCache(2)
cache.put(1, "one")
cache.put(2, "two")
print(cache.get(1))      # 1 becomes most recent
cache.put(3, "three")    # evicts 2, the least recent
print(cache.get(2))
print(list(cache.data))`
  },
  mistakes: [
    "Saying paging causes external fragmentation. Paging removes external fragmentation; it has internal fragmentation in the last page.",
    "Saying Belady's anomaly affects LRU. It affects FIFO; LRU and Optimal are stack algorithms and never get worse with more frames.",
    "Mixing up the TLB with the CPU data cache. The TLB caches address translations, not data.",
    "Saying virtual memory just means swap space. It is the whole mechanism of per-process address spaces translated by the MMU; swap is one part of it.",
    "Answering thrashing with 'add more processes to use the idle CPU', which is exactly what makes it worse.",
    "Claiming each thread has its own heap. Threads share the process heap; each has its own stack."
  ],
  practice: [],
  quiz: [
    {
      q: "Page size is 4 KB. Virtual address 0x3010 maps through a page table where VPN 3 -> frame 2. What is the physical address?",
      options: ["0x3010", "0x2010", "0x0210", "0x2003"],
      answer: 1,
      why: "VPN = 0x3010 >> 12 = 3 and offset = 0x010. Frame 2 gives 2 x 0x1000 + 0x010 = 0x2010."
    },
    {
      q: "Which page replacement algorithm can show Belady's anomaly?",
      options: ["LRU", "Optimal", "FIFO", "None of them"],
      answer: 2,
      why: "FIFO is not a stack algorithm, so the set of pages in memory with n frames is not always a subset of those with n + 1 frames, which allows more faults with more frames."
    },
    {
      q: "TLB access is 10 ns, memory access is 100 ns, TLB hit ratio is 90%. Effective access time with a single-level page table?",
      options: ["110 ns", "120 ns", "200 ns", "210 ns"],
      answer: 1,
      why: "0.9 x (10 + 100) + 0.1 x (10 + 100 + 100) = 99 + 21 = 120 ns."
    }
  ]
},
{
  id: "cs-networks",
  track: "Core CS",
  order: 36,
  week: 7,
  title: "Computer networks: from URL to response",
  minutes: 80,
  goal: "After this lesson you can explain the network layers, TCP vs UDP and the handshake, DNS resolution, HTTP methods and status codes, TLS, cookies, sessions and JWT, CORS, WebSockets, load balancers and CDNs, do subnet math, and narrate 'what happens when you type a URL' end to end.",
  why: "'What happens when you type google.com' is asked in almost every backend interview, and each step is a follow-up question. Backend work is mostly HTTP, so idempotency, status codes and auth tokens come up in design rounds too.",
  sections: [
    {
      h: "Layers, and TCP vs UDP on localhost",
      p: [
        "OSI has 7 layers: Physical, Data link, Network, Transport, Session, Presentation, Application. The real internet uses the 4-layer TCP/IP model: Link (Ethernet, Wi-Fi; MAC addresses, frames), Internet (IP, routing; packets), Transport (TCP or UDP; ports, segments), Application (HTTP, DNS, TLS and so on). Each layer wraps the one above in its own header (encapsulation).",
        "Devices: a switch forwards frames by MAC address (layer 2), a router forwards packets by IP address (layer 3). ARP finds the MAC address for an IP on the local network.",
        "TCP: connection-oriented, reliable and ordered (sequence numbers, ACKs, retransmission), with flow control (receiver window) and congestion control (slow start, congestion avoidance). Used by HTTP/1.1, HTTP/2, databases and SSH.",
        "UDP: connectionless, no delivery or ordering guarantee, tiny 8-byte header, no handshake. Used by DNS, video calls, gaming and QUIC (the base of HTTP/3, which rebuilds reliability on top of UDP).",
        "TCP 3-way handshake: client sends SYN (with its initial sequence number), server replies SYN-ACK, client sends ACK. Closing takes 4 steps: FIN, ACK, FIN, ACK, and the side that closes first sits in TIME_WAIT for a while. In the demo, the kernel performs the handshake inside `create_connection()` and `accept()`; UDP just sends."
      ],
      code: `import socket
import threading

# TCP: connection first (3-way handshake inside connect/accept), then a byte stream
srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
srv.bind(("127.0.0.1", 0))  # port 0 = let the OS pick a free port
srv.listen()
srv.settimeout(5)
port = srv.getsockname()[1]


def serve_once():
    conn, _ = srv.accept()
    with conn:
        data = conn.recv(1024)
        conn.sendall(b"echo: " + data)


t = threading.Thread(target=serve_once)
t.start()
with socket.create_connection(("127.0.0.1", port), timeout=5) as cli:
    cli.sendall(b"hello over TCP")
    print(cli.recv(1024).decode())
t.join()
srv.close()

# UDP: no connection, each sendto is an independent datagram
u_srv = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
u_srv.bind(("127.0.0.1", 0))
u_srv.settimeout(5)
u_cli = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
u_cli.sendto(b"hello over UDP", u_srv.getsockname())
data, _ = u_srv.recvfrom(1024)
print("udp server got:", data.decode())
u_cli.close()
u_srv.close()`,
      out: `echo: hello over TCP
udp server got: hello over UDP`
    },
    {
      h: "DNS: turning a name into an IP",
      p: [
        "Lookup order: browser cache, OS cache (and the hosts file), then the configured recursive resolver (your ISP, 8.8.8.8 or 1.1.1.1).",
        "If the resolver has no cached answer, it walks the hierarchy iteratively: a root server says 'ask the .com TLD servers', the TLD server says 'ask example.com's authoritative name servers', and the authoritative server returns the record. The resolver caches every answer for its TTL.",
        "Records to know: A (name to IPv4), AAAA (IPv6), CNAME (alias to another name), MX (mail server), NS (which name servers are authoritative), TXT (verification, SPF).",
        "DNS uses UDP port 53 for normal queries and falls back to TCP for large responses and zone transfers. Low TTLs allow fast failover but cause more lookups; DNS-based load balancing returns different IPs to different clients.",
        "The demo simulates a recursive resolver with in-memory tables (no network), including the cache hit on the second lookup. 203.0.113.10 is a documentation-only address."
      ],
      code: `ROOT = {"com.": "a.gtld-servers.net"}
TLD = {"a.gtld-servers.net": {"example.com.": "ns1.example-dns.net"}}
AUTHORITATIVE = {"ns1.example-dns.net": {"www.example.com.": ("A", "203.0.113.10", 300)}}
cache = {}


def resolve(name):
    if name in cache:
        print(f"  cache hit -> {cache[name]}")
        return cache[name]
    tld = name.split(".")[-2] + "."
    tld_server = ROOT[tld]
    print(f"  root: try TLD server {tld_server}")
    zone = ".".join(name.split(".")[-3:])
    ns = TLD[tld_server][zone]
    print(f"  TLD: try authoritative server {ns}")
    rtype, ip, ttl = AUTHORITATIVE[ns][name]
    print(f"  authoritative: {rtype} record {ip}, TTL {ttl}s")
    cache[name] = ip
    return ip


for attempt in (1, 2):
    print(f"lookup {attempt} for www.example.com.")
    resolve("www.example.com.")`,
      out: `lookup 1 for www.example.com.
  root: try TLD server a.gtld-servers.net
  TLD: try authoritative server ns1.example-dns.net
  authoritative: A record 203.0.113.10, TTL 300s
lookup 2 for www.example.com.
  cache hit -> 203.0.113.10`
    },
    {
      h: "HTTP methods, idempotency and status codes",
      p: [
        "GET reads (safe: no side effects). POST creates or triggers an action (not idempotent: two POSTs can create two orders). PUT replaces a resource at a known URL (idempotent). PATCH partially updates (not guaranteed idempotent). DELETE removes (idempotent: deleting twice leaves the same state).",
        "Idempotent means repeating the request leaves the server in the same state as doing it once. This matters because clients and proxies retry on timeouts. For POST payments, clients send an `Idempotency-Key` header and the server stores the result per key, so a retry does not charge twice.",
        "Status codes: 2xx success (200 OK, 201 Created, 204 No Content). 3xx redirect (301 permanent, 302/307 temporary, 304 Not Modified for caching). 4xx client error (400 Bad Request, 401 Unauthenticated, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Too Many Requests). 5xx server error (500, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout).",
        "401 vs 403: 401 means 'I do not know who you are'; 403 means 'I know who you are and you are not allowed'.",
        "Versions: HTTP/1.1 has keep-alive connections but one request at a time per connection (head-of-line blocking). HTTP/2 multiplexes many streams over one TCP connection with binary framing and header compression. HTTP/3 runs over QUIC on UDP, removing TCP-level head-of-line blocking.",
        "The demo runs a tiny REST server on localhost with `http.server` and calls it with `http.client`. Note the second DELETE also returns 204: same end state, which is idempotency."
      ],
      code: `import http.client
import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

ITEMS = {"1": "keyboard"}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # keep the demo output clean

    def send_json(self, code, body):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        key = self.path.rsplit("/", 1)[-1]
        if key in ITEMS:
            self.send_json(200, {"id": key, "name": ITEMS[key]})
        else:
            self.send_json(404, {"error": "not found"})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length))
        new_id = str(len(ITEMS) + 1)
        ITEMS[new_id] = body["name"]
        self.send_json(201, {"id": new_id})

    def do_DELETE(self):
        ITEMS.pop(self.path.rsplit("/", 1)[-1], None)
        self.send_response(204)
        self.end_headers()


server = HTTPServer(("127.0.0.1", 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
conn = http.client.HTTPConnection("127.0.0.1", server.server_port, timeout=5)


def call(method, path, body=None):
    headers = {"Content-Type": "application/json"} if body else {}
    conn.request(method, path, body=json.dumps(body) if body else None, headers=headers)
    resp = conn.getresponse()
    text = resp.read().decode() or "(no body)"
    print(method, path, "->", resp.status, resp.reason, text)


call("GET", "/items/1")
call("GET", "/items/9")
call("POST", "/items", {"name": "mouse"})
call("DELETE", "/items/2")
call("DELETE", "/items/2")
conn.close()
server.shutdown()
server.server_close()`,
      out: `GET /items/1 -> 200 OK {"id": "1", "name": "keyboard"}
GET /items/9 -> 404 Not Found {"error": "not found"}
POST /items -> 201 Created {"id": "2"}
DELETE /items/2 -> 204 No Content (no body)
DELETE /items/2 -> 204 No Content (no body)`
    },
    {
      h: "HTTPS/TLS, cookies, sessions and JWT",
      p: [
        "TLS gives encryption, integrity and server authentication. TLS 1.3 handshake in one round trip: the client sends ClientHello with supported ciphers and a key share; the server replies with its key share, its certificate and a signature. The client verifies the certificate chain up to a trusted CA and checks that the hostname matches. Both sides derive the same symmetric session key (ECDHE key exchange), and all data is then encrypted with fast symmetric crypto such as AES-GCM.",
        "Asymmetric crypto (certificates, signatures) is used only to authenticate and agree on keys; bulk data uses symmetric keys because that is much faster. ECDHE gives forward secrecy: stealing the server's private key later does not decrypt old traffic.",
        "HTTP is stateless. Sessions: after login the server stores session data (in Redis, for example) and sends a random session id in a cookie. Use the `HttpOnly` (no JavaScript access, helps against XSS), `Secure` (HTTPS only) and `SameSite` (helps against CSRF) flags. Logout is easy: delete the session server-side.",
        "JWT: the server signs a token `header.payload.signature` and the client sends it as `Authorization: Bearer TOKEN`. Any server with the key can verify it without a database lookup, which suits microservices. Downsides: hard to revoke before expiry (keep expiry short and use refresh tokens), and the payload is only base64-encoded, not encrypted, so never put secrets in it.",
        "The demo builds an HS256 JWT by hand with `hmac` to show why tampering is detected and why the payload is still readable by anyone."
      ],
      code: `import base64
import hashlib
import hmac
import json

SECRET = b"server-side-secret"


def b64(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def unb64(text):
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def compact(obj):
    return json.dumps(obj, separators=(",", ":")).encode()


def sign(payload):
    header, body = b64(compact({"alg": "HS256", "typ": "JWT"})), b64(compact(payload))
    sig = b64(hmac.new(SECRET, f"{header}.{body}".encode(), hashlib.sha256).digest())
    return f"{header}.{body}.{sig}"


def verify(token):
    header, body, sig = token.split(".")
    expected = b64(hmac.new(SECRET, f"{header}.{body}".encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expected):  # constant-time compare
        return "INVALID signature"
    return json.loads(unb64(body))


token = sign({"sub": "user42", "role": "user"})
print("parts in token:", len(token.split(".")))
print("verify original:", verify(token))

h, b, s = token.split(".")
forged = f"{h}.{b64(compact({'sub': 'user42', 'role': 'admin'}))}.{s}"
print("verify forged  :", verify(forged))
print("anyone can read the payload:", unb64(b).decode())`,
      out: `parts in token: 3
verify original: {'sub': 'user42', 'role': 'user'}
verify forged  : INVALID signature
anyone can read the payload: {"sub":"user42","role":"user"}`
    },
    {
      h: "CORS, WebSockets, load balancers and CDNs",
      p: [
        "Same-origin policy: browser JavaScript from origin A (scheme + host + port) cannot read responses from origin B. CORS is how server B opts in, with headers like `Access-Control-Allow-Origin: https://app.example.com`. For non-simple requests (PUT, DELETE, JSON content type, custom headers) the browser first sends an OPTIONS preflight. CORS is enforced by browsers only; curl and servers ignore it, so it is not an auth mechanism.",
        "Real-time updates. Short polling: ask every few seconds (simple, wasteful). Long polling: the server holds the request until there is data. Server-Sent Events: a one-way server-to-client stream over HTTP. WebSockets: one HTTP request upgraded (101 Switching Protocols) to a persistent full-duplex connection, used for chat, live dashboards and multiplayer. Cost: stateful connections make scaling and load balancing harder (sticky sessions, pub/sub between servers).",
        "Load balancer at L4 (transport): routes by IP and port without reading HTTP. Very fast, works for any TCP or UDP traffic. At L7 (application): reads HTTP, so it can route by path or header (/api to one service, /static to another), terminate TLS, add headers, and retry. Examples: AWS NLB is L4, AWS ALB and Nginx are L7.",
        "Balancing algorithms: round robin, weighted round robin, least connections, IP hash or consistent hashing (for stickiness). Health checks remove dead backends from rotation.",
        "CDN: edge servers near users cache static content (images, JS, video) and sometimes API responses. They cut latency and absorb load and DDoS traffic. Control it with `Cache-Control: max-age=...`, use versioned file names for cache busting, and purge on deploy.",
        "The demo compares round robin and least connections when one request is much slower than the others."
      ],
      code: `import heapq

requests = [9, 1, 1, 1, 1, 1]  # seconds each request keeps a server busy
servers = ["s1", "s2", "s3"]

# Round robin ignores how busy a server is
busy_until = {s: 0 for s in servers}
for i, cost in enumerate(requests):
    s = servers[i % len(servers)]
    busy_until[s] += cost
print("round robin      :", busy_until, "-> finishes at", max(busy_until.values()))

# Least loaded: always pick the server that frees up first
heap = [(0, s) for s in servers]
heapq.heapify(heap)
for cost in requests:
    load, s = heapq.heappop(heap)
    heapq.heappush(heap, (load + cost, s))
loads = {s: load for load, s in sorted(heap, key=lambda x: x[1])}
print("least connections:", loads, "-> finishes at", max(loads.values()))`,
      out: `round robin      : {'s1': 10, 's2': 2, 's3': 2} -> finishes at 10
least connections: {'s1': 9, 's2': 3, 's3': 2} -> finishes at 9`
    },
    {
      h: "Subnet math with the ipaddress module",
      p: [
        "IPv4 is 32 bits. CIDR `/26` means the first 26 bits are the network part and the remaining 6 bits address hosts: 2^6 = 64 addresses.",
        "The first address is the network address and the last is the broadcast address, so usable hosts = 2^(32 - prefix) - 2. A /26 gives 62 hosts, and the mask is 255.255.255.192.",
        "Splitting a /26 into /28s gives 2^(28 - 26) = 4 subnets of 16 addresses each.",
        "Private ranges (not routable on the internet, used behind NAT): 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. NAT lets many private hosts share one public IP by rewriting addresses and ports.",
        "Python's `ipaddress` module does all of this, which is handy for checking your hand calculations and for real tasks like IP allow-lists."
      ],
      code: `import ipaddress

net = ipaddress.ip_network("192.168.10.0/26")
hosts = list(net.hosts())
print("network address :", net.network_address)
print("broadcast       :", net.broadcast_address)
print("netmask         :", net.netmask)
print("usable hosts    :", net.num_addresses - 2)
print("first/last host :", hosts[0], hosts[-1])
print("192.168.10.70 in this subnet?", ipaddress.ip_address("192.168.10.70") in net)
print("split into /28  :", [str(s) for s in net.subnets(new_prefix=28)])
print("10.0.0.5 is private?", ipaddress.ip_address("10.0.0.5").is_private)`,
      out: `network address : 192.168.10.0
broadcast       : 192.168.10.63
netmask         : 255.255.255.192
usable hosts    : 62
first/last host : 192.168.10.1 192.168.10.62
192.168.10.70 in this subnet? False
split into /28  : ['192.168.10.0/28', '192.168.10.16/28', '192.168.10.32/28', '192.168.10.48/28']
10.0.0.5 is private? True`
    }
  ],
  template: `What happens when you type a URL (say it in this order):
1. Parse URL: scheme, host, port, path, query. HSTS may force https.
2. DNS: browser cache -> OS cache -> recursive resolver -> root -> TLD -> authoritative. Get the IP.
3. TCP 3-way handshake with IP:443 (SYN, SYN-ACK, ACK).
4. TLS handshake: hello, certificate check, key exchange -> symmetric session key.
5. Send HTTP request: method, path, Host, cookies, headers.
6. Load balancer / CDN -> web server -> app -> cache / database -> response.
7. Response: status, headers (Cache-Control, Set-Cookie), body.
8. Browser parses HTML, fetches CSS/JS/images (more requests, often from a CDN), builds DOM and CSSOM, lays out and paints.
9. Connection kept alive for reuse; eventually FIN/ACK close.`,
  example: {
    name: "Classic question: what happens when you type https://shop.example.com/search?q=usb+hub in the browser and press Enter?",
    steps: [
      "URL parsing: the browser splits scheme, host, port (443 by default for https), path and query. The #fragment, if any, is never sent to the server.",
      "DNS: check the browser and OS caches, then ask the recursive resolver, which walks root, .com TLD and the authoritative server, and returns an A or AAAA record that gets cached for its TTL.",
      "TCP: 3-way handshake with that IP on port 443. With HTTP/3 this would be QUIC over UDP instead.",
      "TLS: ClientHello (with SNI = shop.example.com), the server sends its certificate, the browser validates the chain and hostname, and both sides derive a symmetric session key.",
      "HTTP request: `GET /search?q=usb+hub` with the Host header, cookies (session id), Accept and so on, all encrypted.",
      "Server side: a CDN or load balancer (L7) routes it to an app server, which checks a cache such as Redis, queries the database if needed, and builds the response.",
      "Response: status 200 with headers (Content-Type, Cache-Control, maybe Set-Cookie) and an HTML body. The browser parses HTML, requests CSS, JS and images (often from a CDN, reusing connections), builds the DOM and CSSOM, runs JS, lays out and paints the page."
    ],
    code: `from urllib.parse import parse_qs, urlsplit

url = "https://shop.example.com/search?q=usb+hub&page=2#reviews"
u = urlsplit(url)
port = u.port or (443 if u.scheme == "https" else 80)

print("1. parse  ->", u.scheme, u.hostname, port, u.path, parse_qs(u.query))
print("   fragment stays in the browser:", u.fragment)
print("2. DNS    ->", u.hostname, "resolved to an IP (cached for its TTL)")
print("3. TCP    -> SYN, SYN-ACK, ACK to port", port)
print("4. TLS    -> ClientHello with SNI", u.hostname, "-> certificate check -> session key")
print("5. HTTP request sent inside TLS:")
for line in [f"GET {u.path}?{u.query} HTTP/1.1", f"Host: {u.hostname}",
             "Accept: text/html", "Cookie: session_id=abc123"]:
    print("     " + line)
print("6. server -> load balancer -> app -> cache/DB -> 200 OK + HTML")
print("7. browser -> parse HTML, fetch CSS/JS/images, render")`
  },
  mistakes: [
    "Saying UDP is 'unreliable so never used'. DNS, video calls, gaming and HTTP/3 (QUIC) all run on UDP.",
    "Saying HTTPS encrypts everything with the server's public key. Public-key crypto is only for authentication and key exchange; data is encrypted with a symmetric session key.",
    "Calling PUT and POST interchangeable. PUT is idempotent (replace at a known URL); POST is not.",
    "Mixing up 401 and 403. 401 means not authenticated; 403 means authenticated but not allowed.",
    "Treating CORS as server security. It is a browser rule; non-browser clients ignore it, so you still need authentication.",
    "Putting sensitive data in a JWT payload, assuming it is encrypted. It is only base64-encoded and signed."
  ],
  practice: [],
  quiz: [
    {
      q: "How many usable host addresses does a /27 subnet have?",
      options: ["32", "30", "62", "14"],
      answer: 1,
      why: "2^(32 - 27) = 32 addresses, minus the network and broadcast addresses, gives 30 usable hosts."
    },
    {
      q: "Which HTTP method is NOT idempotent by definition?",
      options: ["GET", "PUT", "DELETE", "POST"],
      answer: 3,
      why: "Repeating a POST can create duplicate resources, for example two orders. GET, PUT and DELETE leave the same server state when repeated."
    },
    {
      q: "You need to route /api/* to one service and /images/* to another based on the URL path. Which load balancer do you need?",
      options: ["L4 load balancer", "L7 load balancer", "DNS round robin", "A switch"],
      answer: 1,
      why: "Path-based routing requires reading the HTTP request, which only an application-layer (L7) load balancer does. L4 sees only IPs and ports."
    }
  ]
}
);
