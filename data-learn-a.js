// Lessons part A: Start, Python foundations, Big-O, interview method, system design basics, project story.
window.LESSONS = window.LESSONS || [];
window.LESSONS.push(
  {
    id: "start-here",
    track: "Start",
    order: 0,
    week: 1,
    title: "How to use this site and study DSA",
    minutes: 15,
    goal: "After this lesson you can run the daily study loop, set up Python, and write a useful note for every problem you solve.",
    why: "Interviews and OAs test whether you can recognise a pattern under time pressure. A fixed daily loop with spaced revisits is what turns 150 problems into patterns you actually remember.",
    sections: [
      {
        h: "The daily loop",
        p: [
          "Every study day follows the same order: read one lesson, copy its template into your own file and run it, then solve 2 problems that use it.",
          "A problem is not done after the first solve. Revisit it on day 3 and day 10: open a blank editor and solve it again without looking. If you can't, it goes back in the queue.",
          "At night, update the tracker (problems solved, revisits done, notes). Then ask Claude \"check my tracker\" so it can spot gaps, overdue revisits and weak topics.",
          "The code below computes your two revisit dates for a problem solved today."
        ],
        code: `from datetime import date, timedelta

def revisit_days(solved_on):
    return [solved_on + timedelta(days=d) for d in (3, 10)]

for d in revisit_days(date(2026, 10, 5)):
    print(d.isoformat())`,
        out: `2026-10-08
2026-10-15`
      },
      {
        h: "The timer rule: 25 / 40 minutes, then Hint 1",
        p: [
          "Start a timer before you read the problem. Easy problems get 25 minutes, Medium get 40.",
          "If the timer ends and you have no working idea, stop. Ask Claude for Hint 1 only, not the solution. Try again for 10 minutes. Then Hint 2. Only after that read a full solution.",
          "Struggling for 25 to 40 minutes is useful. Struggling for 2 hours is not. The timer protects your day.",
          "If you needed a hint or the solution, mark the problem as \"needs revisit\" in the tracker. Those are the ones that matter most on day 3 and day 10."
        ]
      },
      {
        h: "The one-line note: pattern + trick",
        p: [
          "After every problem write exactly one line: the pattern name and the one trick that made it work.",
          "Good: \"Two Sum: complement hashmap. Check `target - x` in `seen` before inserting `x`.\"",
          "Good: \"Move Zeroes: write pointer. Swap non-zero `nums[i]` into `nums[w]`, then `w += 1`.\"",
          "Bad: \"Used a dict, it was easy.\" That note will not help you in 10 days. The note should let you rebuild the solution from memory."
        ]
      },
      {
        h: "Why patterns beat memorising",
        p: [
          "There are thousands of problems but only around 20 core patterns: hashing, two pointers, sliding window, stack, binary search, BFS/DFS, heap, backtracking, DP, greedy, intervals and a few more.",
          "If you memorise 150 solutions, a new problem in an OA looks unfamiliar. If you know the pattern, you read the constraints, notice the signal (sorted input, contiguous subarray, top k, all combinations) and reach for the right template.",
          "So for every problem ask: which pattern is this, and what was the signal in the problem statement that told me so?"
        ]
      },
      {
        h: "Set up Python locally",
        p: [
          "Check Python is installed: open a terminal and run `python3 --version`. You want 3.10 or newer. On Mac use `brew install python` if needed; on Windows install from python.org and tick \"Add to PATH\".",
          "Install VS Code and the official Python extension. Make a folder like `dsa/`, one file per problem, e.g. `001_contains_duplicate.py`.",
          "Run a file with `python3 hello.py` in the terminal (or the Run button in VS Code). Put a small test at the bottom of every file so you can run it instantly."
        ],
        code: `def greet(name):
    return "Hello, " + name

print(greet("DSA"))
print(sum([1, 2, 3]))`,
        out: `Hello, DSA
6`
      },
      {
        h: "Using LeetCode's Python3 editor",
        p: [
          "On LeetCode choose \"Python3\" (not \"Python\", which is Python 2). LeetCode gives you a `class Solution` with one method. You fill in the method; LeetCode calls it with the test input.",
          "`List`, `Optional`, `ListNode` and `TreeNode` are already imported for you on LeetCode. Locally you need `from typing import List` yourself.",
          "Use \"Run\" to test on the examples and your own edge cases, then \"Submit\". Locally, call the method yourself as shown below."
        ],
        code: `from typing import List

class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        return len(set(nums)) < len(nums)

# LeetCode calls the method for you. Locally you call it yourself:
print(Solution().containsDuplicate([1, 2, 3, 1]))
print(Solution().containsDuplicate([1, 2, 3]))`,
        out: `True
False`
      }
    ],
    mistakes: [
      "Reading the solution after 5 minutes. You learn nothing that sticks; use the timer and hints in order.",
      "Skipping the day 3 and day 10 revisits. Without them most solutions are forgotten within two weeks.",
      "Writing notes like \"easy, used dict\". Write the pattern and the exact trick.",
      "Solving only in your head. Always type and run the code; bugs in indexing are what fail OAs.",
      "Picking \"Python\" instead of \"Python3\" on LeetCode, which runs Python 2."
    ],
    practice: [],
    quiz: [
      {
        q: "You have been stuck on a Medium problem for 40 minutes. What next?",
        options: ["Read the full editorial", "Ask Claude for Hint 1 only and try for 10 more minutes", "Skip it forever", "Keep going for another hour"],
        answer: 1,
        why: "The timer rule: after the time limit, take the smallest hint that unblocks you, then try again. Full solutions come last."
      },
      {
        q: "You solved a problem on Monday the 5th. When are its revisits?",
        options: ["Day 1 and day 2", "Day 3 and day 10 (the 8th and the 15th)", "Only before the interview", "Day 30"],
        answer: 1,
        why: "The loop revisits on day 3 and day 10 after the first solve, which spaces the practice so it moves into long-term memory."
      },
      {
        q: "Which note is most useful a week later?",
        options: ["\"Done, easy\"", "\"Two Sum: complement hashmap, check target - x in seen before inserting x\"", "\"Used Python\"", "The full code copied in"],
        answer: 1,
        why: "A pattern + trick line lets you rebuild the solution quickly without rereading everything."
      }
    ]
  },

  {
    id: "py-basics",
    track: "Python",
    order: 1,
    week: 1,
    title: "Python basics for DSA: variables, lists, loops, functions",
    minutes: 40,
    goal: "After this lesson you can write loops over lists with indexes, define functions that return values, and avoid the common list traps in Python.",
    why: "Almost every array problem is a loop over a list with an index or two. Off-by-one errors and list-copy bugs are the most common reason correct ideas fail in OAs.",
    sections: [
      {
        h: "Variables, numbers and division",
        p: [
          "Python variables have no declared type. The main types you will use are `int`, `float`, `str`, `bool` and `None`.",
          "`//` is integer (floor) division and `%` is remainder. `/` always gives a float. Floor division rounds down, so `-7 // 2` is `-4`, not `-3`.",
          "Python ints never overflow, so you don't need `long`. Use `float(\"inf\")` as \"infinity\" for min/max tracking. Swap two values with `a, b = b, a`."
        ],
        code: `x = 5
name = "ada"
pi = 3.14
ok = True
nothing = None
print(type(x).__name__, type(name).__name__, type(pi).__name__, type(ok).__name__, nothing)
print(7 // 2, 7 % 2, 7 / 2, 2 ** 10)
print(-7 // 2)
a, b = 1, 2
a, b = b, a
print(a, b)
INF = float("inf")
print(INF > 10 ** 18)`,
        out: `int str float bool None
3 1 3.5 1024
-4
2 1
True`
      },
      {
        h: "Lists: indexing, slicing, append, pop",
        p: [
          "A list is a dynamic array. `nums[0]` is the first item, `nums[-1]` the last. `len(nums)` is O(1).",
          "`append(x)` and `pop()` at the end are O(1). Slicing `nums[a:b]` makes a new list from index a up to but not including b. `nums[::-1]` is a reversed copy.",
          "To make a 2-D grid use a comprehension: `[[0] * cols for _ in range(rows)]`. Never use `[[0] * cols] * rows`: every row is the same list object, so changing one row changes all."
        ],
        code: `nums = [3, 1, 4, 1, 5]
print(nums[0], nums[-1], len(nums))
nums.append(9)
last = nums.pop()
print(last, nums)
print(nums[1:3], nums[::-1])
grid = [[0] * 3 for _ in range(2)]
grid[0][1] = 7
print(grid)
bad = [[0] * 3] * 2
bad[0][1] = 7
print(bad)`,
        out: `3 5 5
9 [3, 1, 4, 1, 5]
[1, 4] [5, 1, 4, 1, 3]
[[0, 7, 0], [0, 0, 0]]
[[0, 7, 0], [0, 7, 0]]`
      },
      {
        h: "Loops: for, range, while, break",
        p: [
          "`for x in nums` gives values. `for i in range(len(nums))` gives indexes, which you need when you compare neighbours or write back into the list.",
          "`range(a, b, step)` goes from a up to b, excluding b. To go backwards: `range(n - 1, -1, -1)` gives n-1 down to 0.",
          "Use `while` when the loop condition is not a simple count, e.g. two pointers moving toward each other (`while lo < hi`). `break` exits the loop early."
        ],
        code: `nums = [10, 20, 30]
total = 0
for x in nums:
    total += x
print(total)
for i in range(len(nums)):
    print(i, nums[i])
print(list(range(len(nums) - 1, -1, -1)))
lo, hi = 0, 5
while lo < hi:
    lo += 2
print(lo)
for x in nums:
    if x == 20:
        break
print("stopped at", x)`,
        out: `60
0 10
1 20
2 30
[2, 1, 0]
6
stopped at 20`
      },
      {
        h: "Functions: return values, multiple returns, default arguments",
        p: [
          "A function returns `None` if you forget `return`. Return several values as a tuple: `return best, worst`, and unpack them with `hi, lo = f(...)`.",
          "Handle the empty input first. It is the most common edge case in tests.",
          "Never use a mutable default like `def f(x, bucket=[])`. The same list is reused across calls. Use `None` and create the list inside."
        ],
        code: `def max_and_min(nums):
    if not nums:
        return None, None
    best = nums[0]
    worst = nums[0]
    for x in nums:
        if x > best:
            best = x
        elif x < worst:
            worst = x
    return best, worst

hi, lo = max_and_min([4, -2, 9, 0])
print(hi, lo)
print(max_and_min([]))

def add_item(x, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(x)
    return bucket

print(add_item(1), add_item(2))`,
        out: `9 -2
(None, None)
[1] [2]`
      },
      {
        h: "Putting it together: Contains Duplicate (problem 1)",
        p: [
          "Brute force compares every pair with two nested loops: O(n^2) time. Note `j` starts at `i + 1` so you never compare an item with itself.",
          "Better: keep a `set` of values seen so far. Checking `x in seen` is O(1) on average, so the whole thing is O(n) time and O(n) space.",
          "This \"brute force first, then a set or dict to remove the inner loop\" move appears again and again."
        ],
        code: `def contains_duplicate_slow(nums):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] == nums[j]:
                return True
    return False

def contains_duplicate(nums):
    seen = set()
    for x in nums:
        if x in seen:
            return True
        seen.add(x)
    return False

print(contains_duplicate_slow([1, 2, 3, 1]), contains_duplicate([1, 2, 3, 1]))
print(contains_duplicate([1, 2, 3]))`,
        out: `True True
False`
      }
    ],
    template: `def scan(nums):
    n = len(nums)
    if n == 0:
        return 0
    result = 0
    for i in range(n):
        x = nums[i]
        # update result using x (and i, or neighbours like nums[i - 1])
        result += x
    return result

print(scan([1, 2, 3]))`,
    example: {
      name: "Move Zeroes",
      n: 14,
      steps: [
        "Goal: move all zeros to the end in place, keeping the order of non-zero items.",
        "Keep a write pointer `w` = the index where the next non-zero value should go. Start at 0.",
        "Scan with `i`. When `nums[i]` is non-zero, swap it into `nums[w]` and move `w` forward.",
        "Every non-zero lands at the front in order; zeros get pushed behind. O(n) time, O(1) extra space."
      ],
      code: `def move_zeroes(nums):
    w = 0
    for i in range(len(nums)):
        if nums[i] != 0:
            nums[w], nums[i] = nums[i], nums[w]
            w += 1

a = [0, 1, 0, 3, 12]
move_zeroes(a)
print(a)`
    },
    mistakes: [
      "Using `[[0] * m] * n` for a grid; all rows share one list.",
      "Off-by-one in `range`: `range(n)` stops at n-1, `range(1, n)` skips index 0.",
      "Forgetting `return`, so the function returns `None`.",
      "Expecting `-7 // 2` to be -3. Floor division rounds down to -4; use `int(-7 / 2)` to truncate toward zero.",
      "Changing a list while looping over it with `for x in nums` (e.g. removing items). Loop over indexes or build a new list.",
      "Using a mutable default argument like `def f(a=[])`."
    ],
    practice: [1, 14],
    quiz: [
      {
        q: "What does `list(range(5, 0, -2))` give?",
        options: ["[5, 3, 1]", "[5, 3, 1, -1]", "[5, 4, 3, 2, 1]", "[4, 2, 0]"],
        answer: 0,
        why: "Start at 5, step -2, stop before reaching 0: 5, 3, 1."
      },
      {
        q: "Which creates a correct 3 x 4 grid of zeros?",
        options: ["[[0] * 4] * 3", "[[0] * 4 for _ in range(3)]", "[0] * 12", "[[0, 0, 0]] * 4"],
        answer: 1,
        why: "The comprehension builds a new inner list for every row. Multiplying an outer list copies references to one inner list."
      },
      {
        q: "What does `9 // 2, 9 % 2` evaluate to?",
        options: ["(4.5, 1)", "(4, 1)", "(5, 1)", "(4, 0)"],
        answer: 1,
        why: "`//` is floor division (4) and `%` is the remainder (1)."
      }
    ]
  },

  {
    id: "py-strings-dicts",
    track: "Python",
    order: 2,
    week: 1,
    title: "Strings, dicts, sets and tuples",
    minutes: 40,
    goal: "After this lesson you can manipulate strings, count things with a dict, check membership with a set, and use tuples as dict keys.",
    why: "Hashing problems (anagrams, two sum, frequency counts) are the most common Easy and Medium OA questions, and they are all built on dicts and sets.",
    sections: [
      {
        h: "Strings",
        p: [
          "Strings are immutable: you can't do `s[0] = \"x\"`. To build a string, collect pieces in a list and call `\"\".join(pieces)` at the end. Adding strings in a loop with `+=` can be O(n^2).",
          "Slicing works like lists. `s[::-1]` reverses. `split()` breaks into a list, `join()` glues a list back.",
          "`ord(\"a\")` is 97. `ord(ch) - ord(\"a\")` maps a lowercase letter to 0..25, handy for a 26-slot count array. `isalnum()`, `isalpha()`, `isdigit()`, `lower()` help with palindrome-style cleaning."
        ],
        code: `s = "Hello, World"
print(s[0], s[-1], s[7:12], len(s))
print(s.lower(), s.upper())
print(s.split(", "))
print("-".join(["a", "b", "c"]))
print(ord("a"), chr(98), ord("c") - ord("a"))
print("abc"[::-1], "racecar" == "racecar"[::-1])
print("a1!".isalnum(), "a1".isalnum(), "x".isalpha(), "7".isdigit())
chars = []
for ch in "abc":
    chars.append(ch.upper())
print("".join(chars))`,
        out: `H d World 12
hello, world HELLO, WORLD
['Hello', 'World']
a-b-c
97 b 2
cba True
False True True True
ABC`
      },
      {
        h: "Dicts: key to value in O(1)",
        p: [
          "A dict maps keys to values. Lookup, insert and `key in d` are O(1) on average.",
          "`d[key]` raises `KeyError` if the key is missing. `d.get(key, 0)` returns a default instead, which makes counting one line: `count[ch] = count.get(ch, 0) + 1`.",
          "Loop with `for key, val in d.items()`. Dicts keep insertion order (Python 3.7+)."
        ],
        code: `count = {}
for ch in "banana":
    count[ch] = count.get(ch, 0) + 1
print(count)
print(count["a"], count.get("z", 0), "n" in count)
for key, val in count.items():
    print(key, val)
del count["b"]
print(list(count.keys()), list(count.values()))`,
        out: `{'b': 1, 'a': 3, 'n': 2}
3 0 True
b 1
a 3
n 2
['a', 'n'] [3, 2]`
      },
      {
        h: "Sets: \"have I seen this?\" in O(1)",
        p: [
          "A set stores unique values with O(1) average `add` and `in`. Use it when you only care whether something exists, not how many times.",
          "`&` is intersection, `|` is union, `-` is difference.",
          "`{}` is an empty dict, not a set. Write `set()` for an empty set. Sets have no order you should rely on; use `sorted(s)` if you need order."
        ],
        code: `seen = set()
seen.add(3)
seen.add(3)
seen.add(5)
print(seen, len(seen), 3 in seen)
a = {1, 2, 3}
b = {2, 3, 4}
print(a & b, a | b, a - b)
print(sorted(set([3, 1, 3, 2])))
empty = set()
print(type(empty).__name__, type({}).__name__)`,
        out: `{3, 5} 2 True
{2, 3} {1, 2, 3, 4} {1}
[1, 2, 3]
set dict`
      },
      {
        h: "Tuples: fixed, hashable, great as keys",
        p: [
          "A tuple is an immutable list: `(2, 3)`. Because it can't change, it is hashable, so it can be a dict key or go in a set. Lists can't.",
          "Use tuples for grid coordinates `(r, c)` in visited sets, and as canonical keys, e.g. `tuple(sorted(word))` for anagram grouping.",
          "Tuples compare item by item, so sorting a list of tuples sorts by the first item, then the second on ties."
        ],
        code: `point = (2, 3)
x, y = point
print(x, y, point[0])
dist = {}
dist[(0, 0)] = 0
dist[(1, 2)] = 3
print(dist[(1, 2)])
key = tuple(sorted("eat"))
print(key)
pairs = [(1, "b"), (1, "a"), (0, "z")]
print(sorted(pairs))`,
        out: `2 3 2
3
('a', 'e', 't')
[(0, 'z'), (1, 'a'), (1, 'b')]`
      }
    ],
    template: `def frequency(items):
    count = {}
    for x in items:
        count[x] = count.get(x, 0) + 1
    return count

def seen_before(items):
    seen = set()
    for x in items:
        if x in seen:
            return x
        seen.add(x)
    return None

print(frequency("hello"))
print(seen_before([4, 2, 7, 2]))`,
    example: {
      name: "Valid Anagram",
      n: 2,
      steps: [
        "Two strings are anagrams if every character appears the same number of times in both.",
        "If lengths differ, return False immediately.",
        "Count characters of `s` in a dict. Walk `t` and decrement; if a count would go below zero, `t` has an extra character.",
        "O(n) time, O(k) space where k is the number of distinct characters (at most 26 for lowercase). One-liner alternative: `Counter(s) == Counter(t)`."
      ],
      code: `def is_anagram(s, t):
    if len(s) != len(t):
        return False
    count = {}
    for ch in s:
        count[ch] = count.get(ch, 0) + 1
    for ch in t:
        if count.get(ch, 0) == 0:
            return False
        count[ch] -= 1
    return True

print(is_anagram("anagram", "nagaram"))
print(is_anagram("rat", "car"))`
    },
    mistakes: [
      "Building a string with `+=` inside a loop. Append to a list and `\"\".join()` once.",
      "Using `d[key]` on a missing key and getting `KeyError`. Use `d.get(key, default)` or `defaultdict`.",
      "Writing `{}` and expecting an empty set.",
      "Trying to use a list as a dict key or set member. Convert to a tuple first.",
      "Relying on set order when printing or returning results."
    ],
    practice: [2, 3],
    quiz: [
      {
        q: "Which can be used as a dict key?",
        options: ["[1, 2]", "(1, 2)", "{1, 2}", "{\"a\": 1}"],
        answer: 1,
        why: "Keys must be hashable. Tuples are immutable and hashable; lists, sets and dicts are not."
      },
      {
        q: "What does `count.get(\"z\", 0)` return when \"z\" is not a key?",
        options: ["None", "KeyError", "0", "\"z\""],
        answer: 2,
        why: "`get` returns the default you pass when the key is missing."
      },
      {
        q: "What is the average time for `x in s` when `s` is a set?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        answer: 0,
        why: "Sets are hash tables, so membership is O(1) on average. For a list it would be O(n)."
      }
    ]
  },

  {
    id: "py-idioms",
    track: "Python",
    order: 3,
    week: 1,
    title: "Pythonic idioms: comprehensions, sorting with key, lambda, enumerate, zip",
    minutes: 35,
    goal: "After this lesson you can write short, correct Python with comprehensions, custom sort keys, enumerate and zip instead of manual index juggling.",
    why: "Shorter code means fewer bugs under time pressure. Custom sort keys show up directly in intervals, greedy and \"sort by frequency\" problems.",
    sections: [
      {
        h: "Comprehensions",
        p: [
          "`[expr for x in items if cond]` builds a list in one line. The `if` at the end filters; `a if cond else b` at the front chooses a value.",
          "Nested comprehensions read left to right like nested loops: `[v for row in grid for v in row]` flattens a grid.",
          "Dict and set comprehensions work the same: `{x: i for i, x in enumerate(items)}` builds a value-to-index map."
        ],
        code: `nums = [1, 2, 3, 4, 5]
squares = [x * x for x in nums]
evens = [x for x in nums if x % 2 == 0]
labels = ["even" if x % 2 == 0 else "odd" for x in nums]
print(squares)
print(evens)
print(labels)
grid = [[r * 3 + c for c in range(3)] for r in range(2)]
print(grid)
flat = [v for row in grid for v in row]
print(flat)
index_of = {x: i for i, x in enumerate(["a", "b", "c"])}
print(index_of)
lengths = {len(w) for w in ["hi", "yo", "hey"]}
print(lengths)`,
        out: `[1, 4, 9, 16, 25]
[2, 4]
['odd', 'even', 'odd', 'even', 'odd']
[[0, 1, 2], [3, 4, 5]]
[0, 1, 2, 3, 4, 5]
{'a': 0, 'b': 1, 'c': 2}
{2, 3}`
      },
      {
        h: "Sorting with key and lambda",
        p: [
          "`sorted(x)` returns a new list; `x.sort()` sorts in place and returns `None`. Both are O(n log n) and stable (equal items keep their order).",
          "`key=` is a function applied to each item; Python sorts by its result. `lambda w: (len(w), w)` sorts by length, then alphabetically on ties.",
          "For descending on a number but ascending on a name, negate the number: `key=lambda p: (-p[1], p[0])`. `max` and `min` accept `key=` too."
        ],
        code: `nums = [5, 2, 9, 1]
print(sorted(nums), nums)
nums.sort(reverse=True)
print(nums)
words = ["pear", "banana", "kiwi", "apple", "fig"]
print(sorted(words, key=len))
print(sorted(words, key=lambda w: (len(w), w)))
people = [("ravi", 25), ("asha", 31), ("dev", 25)]
print(sorted(people, key=lambda p: (-p[1], p[0])))
intervals = [[5, 6], [1, 3], [2, 4]]
intervals.sort(key=lambda iv: iv[0])
print(intervals)
print(max(words, key=len), min(people, key=lambda p: p[1]))`,
        out: `[1, 2, 5, 9] [5, 2, 9, 1]
[9, 5, 2, 1]
['fig', 'pear', 'kiwi', 'apple', 'banana']
['fig', 'kiwi', 'pear', 'apple', 'banana']
[('asha', 31), ('dev', 25), ('ravi', 25)]
[[1, 3], [2, 4], [5, 6]]
banana ('ravi', 25)`
      },
      {
        h: "enumerate and zip",
        p: [
          "`enumerate(items)` gives `(index, value)` pairs, so you don't need `range(len(...))` plus `items[i]`. `start=1` changes the first index.",
          "`zip(a, b)` walks two lists together and stops at the shorter one. `zip(nums, nums[1:])` gives neighbouring pairs, useful for differences.",
          "`dict(zip(keys, values))` builds a dict from two lists."
        ],
        code: `names = ["a", "b", "c"]
for i, name in enumerate(names):
    print(i, name)
for i, name in enumerate(names, start=1):
    print(i, name)
scores = [90, 80, 70]
for name, score in zip(names, scores):
    print(name, score)
print(list(zip([1, 2, 3], [4, 5])))
nums = [1, 3, 6, 10]
diffs = [b - a for a, b in zip(nums, nums[1:])]
print(diffs)
print(dict(zip(names, scores)))`,
        out: `0 a
1 b
2 c
1 a
2 b
3 c
a 90
b 80
c 70
[(1, 4), (2, 5)]
[2, 3, 4]
{'a': 90, 'b': 80, 'c': 70}`
      },
      {
        h: "Small idioms that save time",
        p: [
          "`any(...)` and `all(...)` with a generator replace flag variables.",
          "`sum(x for x in nums if x > 0)` sums with a filter without building a list.",
          "Star unpacking `first, *rest = nums` splits a list. `reversed(nums)` iterates backwards without copying."
        ],
        code: `nums = [3, -1, 4]
print(any(x < 0 for x in nums), all(x > 0 for x in nums))
print(sum(x for x in nums if x > 0))
a, b = 1, 2
a, b = b, a
print(a, b)
first, *rest = nums
print(first, rest)
print(nums[::-1], list(reversed(nums)))`,
        out: `True False
7
2 1
3 [-1, 4]
[4, -1, 3] [4, -1, 3]`
      }
    ],
    template: `def sort_and_scan(items):
    items = sorted(items, key=lambda it: (it[0], -it[1]))
    out = []
    for i, (a, b) in enumerate(items):
        out.append((i, a, b))
    return out

print(sort_and_scan([(2, 1), (1, 5), (1, 9)]))`,
    example: {
      name: "Squares of a Sorted Array",
      n: 23,
      steps: [
        "Input is sorted but may contain negatives, so squares are not sorted: [-4, -1, 0, 3, 10] squares to [16, 1, 0, 9, 100].",
        "The largest square is at one of the two ends (biggest negative or biggest positive).",
        "Use two pointers `l` and `r` at the ends, and fill the result from the back: put the bigger square at position k, move that pointer inward.",
        "O(n) time instead of O(n log n) for square-then-sort. The one-line sort version is a fine brute force to mention first."
      ],
      code: `def sorted_squares(nums):
    n = len(nums)
    res = [0] * n
    l, r = 0, n - 1
    for k in range(n - 1, -1, -1):
        if abs(nums[l]) > abs(nums[r]):
            res[k] = nums[l] * nums[l]
            l += 1
        else:
            res[k] = nums[r] * nums[r]
            r -= 1
    return res

print(sorted_squares([-4, -1, 0, 3, 10]))
print(sorted([x * x for x in [-4, -1, 0, 3, 10]]))`
    },
    mistakes: [
      "Writing `nums = nums.sort()`. `sort()` returns `None`; use `nums.sort()` alone or `nums = sorted(nums)`.",
      "Forgetting that `zip` stops at the shorter list and silently drops items.",
      "Using `reverse=True` when only one field should be descending. Negate that field in the key instead.",
      "Putting the filter `if` in the wrong place: `[x for x in a if c]` filters; `[x if c else y for x in a]` maps.",
      "Writing huge nested comprehensions. If it doesn't fit on one readable line, use a normal loop."
    ],
    practice: [15, 23],
    quiz: [
      {
        q: "What does `sorted([\"bb\", \"a\", \"ccc\", \"dd\"], key=len)` return?",
        options: ["['a', 'bb', 'dd', 'ccc']", "['a', 'dd', 'bb', 'ccc']", "['ccc', 'bb', 'dd', 'a']", "['a', 'bb', 'ccc', 'dd']"],
        answer: 0,
        why: "Sorted by length, and sorting is stable, so \"bb\" stays before \"dd\" because it came first."
      },
      {
        q: "How do you sort `people` (name, age) by age descending, then name ascending?",
        options: ["sorted(people, reverse=True)", "sorted(people, key=lambda p: (-p[1], p[0]))", "sorted(people, key=lambda p: (p[1], p[0]), reverse=True)", "people.sort(key=p[1])"],
        answer: 1,
        why: "Negating the age gives descending age while the name stays ascending. `reverse=True` would flip both fields."
      },
      {
        q: "What is `list(zip([1, 2, 3], [\"a\", \"b\"]))`?",
        options: ["[(1, 'a'), (2, 'b'), (3, None)]", "[(1, 'a'), (2, 'b')]", "Error", "[1, 'a', 2, 'b']"],
        answer: 1,
        why: "`zip` stops at the shortest input."
      }
    ]
  },

  {
    id: "py-stdlib",
    track: "Python",
    order: 4,
    week: 1,
    title: "Interview toolkit: collections, heapq, bisect, itertools",
    minutes: 45,
    goal: "After this lesson you can use Counter, defaultdict, deque, heapq, bisect and itertools to replace 10 lines of manual code with 1.",
    why: "These modules are allowed in every Python interview and OA. Knowing them cuts coding time and avoids slow mistakes like `list.pop(0)` for a queue.",
    sections: [
      {
        h: "Counter: counting in one line",
        p: [
          "`Counter(iterable)` builds a frequency dict. Missing keys return 0 instead of raising an error.",
          "`most_common(k)` returns the k most frequent `(item, count)` pairs. Two Counters can be compared with `==`, added with `+` and subtracted with `-` (negative counts are dropped)."
        ],
        code: `from collections import Counter

cnt = Counter("mississippi")
print(cnt["s"], cnt["z"])
print(cnt.most_common(2))
print(Counter("listen") == Counter("silent"))
a = Counter([1, 1, 2])
b = Counter([1, 2, 2, 3])
print(a + b)
print(b - a)`,
        out: `4 0
[('i', 4), ('s', 4)]
True
Counter({1: 3, 2: 3, 3: 1})
Counter({2: 1, 3: 1})`
      },
      {
        h: "defaultdict and deque",
        p: [
          "`defaultdict(list)` creates an empty list the first time you touch a key, so `graph[u].append(v)` just works. Careful: even reading `graph[99]` creates the key.",
          "`deque` is a double-ended queue: `append`, `appendleft`, `pop` and `popleft` are all O(1). Use it for BFS. `list.pop(0)` is O(n) and makes BFS O(n^2).",
          "`deque(maxlen=k)` keeps only the last k items, handy for fixed-size windows."
        ],
        code: `from collections import defaultdict, deque

graph = defaultdict(list)
for u, v in [(1, 2), (1, 3), (2, 4)]:
    graph[u].append(v)
    graph[v].append(u)
print(dict(graph))
print(graph[99], 99 in graph)

q = deque([1, 2, 3])
q.append(4)
q.appendleft(0)
print(q.popleft(), q.pop(), list(q))
window = deque(maxlen=3)
for x in [1, 2, 3, 4, 5]:
    window.append(x)
print(list(window))`,
        out: `{1: [2, 3], 2: [1, 4], 3: [1], 4: [2]}
[] True
0 4 [1, 2, 3]
[3, 4, 5]`
      },
      {
        h: "heapq: a min-heap on a plain list",
        p: [
          "`heapq` keeps the smallest item at `h[0]`. `heappush` and `heappop` are O(log n); `heapify(list)` is O(n).",
          "Python only has a min-heap. For a max-heap push `-x` and negate when you pop.",
          "Push tuples like `(priority, item)` to order by priority. `nlargest(k, items)` and `nsmallest(k, items)` are quick for top-k."
        ],
        code: `import heapq

h = []
for x in [5, 1, 8, 3]:
    heapq.heappush(h, x)
print(h[0], heapq.heappop(h), heapq.heappop(h))
nums = [4, 9, 2, 7]
heapq.heapify(nums)
print(nums[0])
maxh = []
for x in [5, 1, 8]:
    heapq.heappush(maxh, -x)
print(-heapq.heappop(maxh))
tasks = []
heapq.heappush(tasks, (2, "write"))
heapq.heappush(tasks, (1, "read"))
print(heapq.heappop(tasks))
print(heapq.nlargest(2, [4, 9, 2, 7]), heapq.nsmallest(2, [4, 9, 2, 7]))`,
        out: `1 1 3
2
8
(1, 'read')
[9, 7] [2, 4]`
      },
      {
        h: "bisect: binary search on a sorted list",
        p: [
          "`bisect_left(a, x)` returns the first index where `a[i] >= x`. `bisect_right(a, x)` returns the first index where `a[i] > x`.",
          "So `bisect_right(a, x) - bisect_left(a, x)` counts copies of x, and `bisect_left` returning `len(a)` means every item is smaller than x.",
          "`insort(a, x)` inserts while keeping `a` sorted (the search is O(log n), the insert is O(n))."
        ],
        code: `import bisect

a = [1, 3, 3, 3, 7]
print(bisect.bisect_left(a, 3), bisect.bisect_right(a, 3))
print(bisect.bisect_left(a, 4), bisect.bisect_left(a, 100))
print(bisect.bisect_right(a, 3) - bisect.bisect_left(a, 3))
bisect.insort(a, 5)
print(a)`,
        out: `1 4
4 5
3
[1, 3, 3, 3, 5, 7]`
      },
      {
        h: "itertools: prefix sums, combinations, permutations",
        p: [
          "`accumulate(nums)` gives running (prefix) sums.",
          "`combinations(items, k)` gives every k-sized subset in order; `permutations(items)` gives every ordering (n! of them); `product(..., repeat=k)` gives every k-length choice with repetition.",
          "These are great for brute force checks and for testing your own solutions on small inputs."
        ],
        code: `from itertools import accumulate, combinations, permutations, product

print(list(accumulate([1, 2, 3, 4])))
print(list(combinations([1, 2, 3], 2)))
print(list(permutations([1, 2, 3]))[:3])
print(list(product([0, 1], repeat=2)))
print(len(list(permutations(range(4)))))`,
        out: `[1, 3, 6, 10]
[(1, 2), (1, 3), (2, 3)]
[(1, 2, 3), (1, 3, 2), (2, 1, 3)]
[(0, 0), (0, 1), (1, 0), (1, 1)]
24`
      }
    ],
    template: `import heapq
from collections import Counter

def top_k_frequent(nums, k):
    cnt = Counter(nums)
    return heapq.nlargest(k, cnt.keys(), key=cnt.get)

print(top_k_frequent([1, 1, 1, 2, 2, 3], 2))`,
    example: {
      name: "Group Anagrams",
      n: 4,
      steps: [
        "Anagrams share the same letters, so sorting each word gives the same canonical key: \"eat\", \"tea\", \"ate\" all become ('a', 'e', 't').",
        "Use a `defaultdict(list)` from key to the list of words with that key.",
        "Key must be hashable, so use `tuple(sorted(w))` (or `\"\".join(sorted(w))`).",
        "Time O(n * k log k) for n words of length k. A 26-count tuple key makes it O(n * k)."
      ],
      code: `from collections import defaultdict

def group_anagrams(strs):
    groups = defaultdict(list)
    for w in strs:
        key = tuple(sorted(w))
        groups[key].append(w)
    return list(groups.values())

print(group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))`
    },
    mistakes: [
      "Using `list.pop(0)` as a queue. Use `deque.popleft()`.",
      "Forgetting heapq is a min-heap. Push `-x` for max-heap behaviour and negate on pop.",
      "Reading a missing key from a `defaultdict` in a check like `if graph[x]`, which silently adds the key. Use `x in graph`.",
      "Pushing tuples into a heap where the second item is not comparable (e.g. two nodes with equal priority). Add a tie-breaker counter: `(priority, i, node)`.",
      "Mixing up `bisect_left` and `bisect_right` when the value appears more than once."
    ],
    practice: [4, 5],
    quiz: [
      {
        q: "You need a queue for BFS. Which is O(1) per removal?",
        options: ["list.pop(0)", "deque.popleft()", "list.remove(x)", "heapq.heappop on a list"],
        answer: 1,
        why: "`deque.popleft()` is O(1). `list.pop(0)` shifts every item, O(n). A heap pop is O(log n) and orders by value, not arrival."
      },
      {
        q: "a = [1, 2, 2, 2, 5]. What is `bisect_left(a, 2)`?",
        options: ["1", "2", "3", "4"],
        answer: 0,
        why: "The first index where `a[i] >= 2` is 1."
      },
      {
        q: "How do you get the largest item from a heap built with heapq?",
        options: ["heapq.heappop(h) on normal values", "Store -x and return -heapq.heappop(h)", "h[-1]", "heapq.heapmax(h)"],
        answer: 1,
        why: "heapq is a min-heap. Negating values turns the smallest stored value into the largest original value. `h[-1]` is not guaranteed to be the max."
      }
    ]
  },

  {
    id: "py-classes-recursion",
    track: "Python",
    order: 5,
    week: 1,
    title: "Classes and recursion (how to think about a recursive call)",
    minutes: 50,
    goal: "After this lesson you can read LeetCode's ListNode and TreeNode classes, write a recursive function with a clear base case, and speed it up with @cache.",
    why: "Linked lists, trees, backtracking and DP are about 40% of interview problems, and all of them use small classes and recursion.",
    sections: [
      {
        h: "Classes in 2 minutes",
        p: [
          "A class bundles data and functions. `__init__` runs when you create an object; `self` is the object itself. Attributes are set with `self.items = []`.",
          "Methods always take `self` first. `__repr__` controls what `print(obj)` shows, which helps debugging.",
          "In interviews you write classes for design problems (LRU cache, MinStack) and use the ones LeetCode gives you."
        ],
        code: `class Stack:
    def __init__(self):
        self.items = []

    def push(self, x):
        self.items.append(x)

    def pop(self):
        return self.items.pop()

    def is_empty(self):
        return len(self.items) == 0

    def __repr__(self):
        return "Stack(" + str(self.items) + ")"

s = Stack()
s.push(1)
s.push(2)
print(s)
print(s.pop(), s.is_empty())`,
        out: `Stack([1, 2])
2 False`
      },
      {
        h: "ListNode, exactly as LeetCode defines it",
        p: [
          "A linked list node holds `val` and `next` (the next node, or `None` at the end). LeetCode passes you `head`, the first node.",
          "LeetCode does not give you a helper to build or print lists. Write `build` and `to_list` once and reuse them for local testing.",
          "The `dummy` node trick: start with a fake node so you never special-case an empty result, then return `dummy.next`."
        ],
        code: `from typing import Optional

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build(values):
    dummy = ListNode()
    cur = dummy
    for v in values:
        cur.next = ListNode(v)
        cur = cur.next
    return dummy.next

def to_list(head: Optional[ListNode]):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out

head = build([1, 2, 3])
print(head.val, head.next.val, to_list(head))`,
        out: `1 2 [1, 2, 3]`
      },
      {
        h: "TreeNode, and your first recursive functions",
        p: [
          "A binary tree node holds `val`, `left` and `right`. An empty tree is `None`.",
          "Tree recursion has one shape: if the node is `None`, return the answer for an empty tree (base case). Otherwise ask the same question of `left` and `right` and combine.",
          "Trust the recursive call. When writing `max_depth`, assume `max_depth(node.left)` already returns the right depth of the left subtree. You only decide how to combine."
        ],
        code: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# root 1 has children 2 and 3; node 2 has a left child 4
root = TreeNode(1, TreeNode(2, TreeNode(4)), TreeNode(3))

def max_depth(node):
    if node is None:
        return 0
    return 1 + max(max_depth(node.left), max_depth(node.right))

def count_nodes(node):
    if not node:
        return 0
    return 1 + count_nodes(node.left) + count_nodes(node.right)

print(max_depth(root), count_nodes(root))`,
        out: `3 4`
      },
      {
        h: "What actually happens: the call stack",
        p: [
          "Each call waits for the call it made. Calls pile up on the call stack until a base case returns, then answers flow back up.",
          "Printing with indentation by depth is the easiest way to see this. Do it whenever recursion confuses you.",
          "Every recursive function needs: (1) a base case that returns without recursing, (2) a recursive case that moves toward the base case (smaller n, child node, next index)."
        ],
        code: `def fact(n, depth=0):
    print("  " * depth + "fact(" + str(n) + ")")
    if n <= 1:
        return 1
    return n * fact(n - 1, depth + 1)

print(fact(4))`,
        out: `fact(4)
  fact(3)
    fact(2)
      fact(1)
24`
      },
      {
        h: "Recursion trees, memoisation with @cache, and the recursion limit",
        p: [
          "Plain `fib(n)` calls `fib(n-1)` and `fib(n-2)`, and those repeat the same work. Draw the recursion tree: `fib(3)` is computed many times. The call count grows roughly like 2^n.",
          "`@cache` from `functools` remembers results by argument. Each `n` is computed once, so `fib` becomes O(n). This is top-down dynamic programming.",
          "Python's default recursion limit is 1000 deep, so `depth(5000)` below would crash without raising it. For deep recursion call `sys.setrecursionlimit(10000)` or convert to a loop. On LeetCode, very deep trees (e.g. 10^5 nodes in a line) can still crash; iterative is safer there."
        ],
        code: `import sys
from functools import cache

calls = 0

def fib(n):
    global calls
    calls += 1
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(20), calls)

@cache
def fib_memo(n):
    if n < 2:
        return n
    return fib_memo(n - 1) + fib_memo(n - 2)

print(fib_memo(90))

def depth(n):
    if n == 0:
        return 0
    return 1 + depth(n - 1)

sys.setrecursionlimit(10000)
print(depth(5000))`,
        out: `6765 21891
2880067194370816120
5000`
      }
    ],
    template: `from functools import cache

@cache
def solve(i):
    # base case: smallest input you can answer directly
    if i <= 1:
        return 1
    # recursive case: trust solve() on smaller inputs, then combine
    return solve(i - 1) + solve(i - 2)

print(solve(10))`,
    example: {
      name: "Climbing Stairs",
      n: 117,
      steps: [
        "To reach step n your last move was either 1 step (from n-1) or 2 steps (from n-2).",
        "So ways(n) = ways(n-1) + ways(n-2). Base cases: ways(0) = 1 (stand still), ways(1) = 1.",
        "Plain recursion is O(2^n). Add `@cache` and it becomes O(n).",
        "Each value only needs the previous two, so a loop with two variables gives O(n) time and O(1) space."
      ],
      code: `from functools import cache

def climb_stairs(n):
    @cache
    def ways(i):
        if i <= 1:
            return 1
        return ways(i - 1) + ways(i - 2)
    return ways(n)

def climb_stairs_iter(n):
    a, b = 1, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b

for n in [1, 2, 3, 5, 10]:
    print(n, climb_stairs(n), climb_stairs_iter(n))`
    },
    mistakes: [
      "No base case, or a base case that is never reached, giving `RecursionError`.",
      "Forgetting to `return` the recursive result: writing `helper(node.left)` instead of `return helper(node.left)`.",
      "Using `@cache` on a function whose argument is a list. Arguments must be hashable; pass a tuple or an index instead.",
      "Accessing `node.left` without first checking `node is None`.",
      "Trying to trace every call in your head. Trust the call on smaller input and only check the base case and the combine step."
    ],
    practice: [117],
    quiz: [
      {
        q: "What must every recursive function have?",
        options: ["A global variable", "A base case that returns without recursing", "Two recursive calls", "A loop"],
        answer: 1,
        why: "Without a base case the calls never stop and Python raises `RecursionError`."
      },
      {
        q: "What does `@cache` change for `fib(n)`?",
        options: ["Nothing, it only saves memory", "Time goes from about O(2^n) to O(n)", "It makes recursion unlimited", "It converts recursion to a loop"],
        answer: 1,
        why: "Each distinct n is computed once and then looked up, so there are only n real computations."
      },
      {
        q: "For an empty tree (`root is None`), what should `max_depth(root)` return?",
        options: ["-1", "0", "1", "None"],
        answer: 1,
        why: "An empty tree has depth 0. That is the base case that makes `1 + max(left, right)` correct for leaves."
      }
    ]
  },

  {
    id: "big-o",
    track: "Python",
    order: 6,
    week: 1,
    title: "Big-O: estimating time and space in 2 minutes",
    minutes: 30,
    goal: "After this lesson you can state the time and space complexity of your code and use the input size n to guess which complexity the intended solution needs.",
    why: "Interviewers always ask \"what's the complexity?\", and OA constraints tell you which algorithm will pass before you write a line.",
    sections: [
      {
        h: "What Big-O means",
        p: [
          "Big-O describes how the number of steps grows as input size n grows. Drop constants and smaller terms: 3n + 5 is O(n), n^2 + n is O(n^2).",
          "Rules of thumb: one loop over n is O(n). A loop inside a loop is O(n^2). Halving n each step is O(log n). Sorting is O(n log n).",
          "Watch the step counts below. Linear grows 10x when n grows 10x, quadratic grows 100x, log grows by about 3."
        ],
        code: `def count_steps(n):
    linear = 0
    for i in range(n):
        linear += 1
    quadratic = 0
    for i in range(n):
        for j in range(n):
            quadratic += 1
    log_steps = 0
    m = n
    while m > 1:
        m //= 2
        log_steps += 1
    return linear, quadratic, log_steps

for n in [10, 100, 1000]:
    print(n, count_steps(n))`,
        out: `10 (10, 100, 3)
100 (100, 10000, 6)
1000 (1000, 1000000, 9)`
      },
      {
        h: "Read n from the constraints, pick the complexity",
        p: [
          "A judge does roughly 10^8 simple operations per second in C++. Python is about 10x slower, so in Python aim one step faster than the table when n is near the limit, and lean on built-ins (`sort`, `set`, `Counter`) which run in C.",
          "n <= 10: O(n!). n <= 20: O(2^n). n <= 500: O(n^3). n <= 10^4: O(n^2). n <= 10^6: O(n log n). n <= 10^8: O(n). Bigger: O(log n) or O(1).",
          "So if a problem says n <= 10^5, a double loop (10^10 steps) will time out; you need O(n) or O(n log n)."
        ],
        code: `LIMITS = [
    (10, "O(n!)", "permutations, brute-force backtracking"),
    (20, "O(2^n)", "subsets, bitmask"),
    (500, "O(n^3)", "triple loop, interval DP"),
    (10 ** 4, "O(n^2)", "double loop, 2-D DP"),
    (10 ** 6, "O(n log n)", "sorting, heap, binary search per item"),
    (10 ** 8, "O(n)", "single pass, two pointers, hashing"),
]

def allowed(n):
    for limit, big_o, idea in LIMITS:
        if n <= limit:
            return big_o + " -> " + idea
    return "O(log n) or O(1) -> math, binary search"

for n in [8, 18, 300, 5000, 200000, 10 ** 7, 10 ** 12]:
    print(n, allowed(n))`,
        out: `8 O(n!) -> permutations, brute-force backtracking
18 O(2^n) -> subsets, bitmask
300 O(n^3) -> triple loop, interval DP
5000 O(n^2) -> double loop, 2-D DP
200000 O(n log n) -> sorting, heap, binary search per item
10000000 O(n) -> single pass, two pointers, hashing
1000000000000 O(log n) or O(1) -> math, binary search`
      },
      {
        h: "What Python operations cost",
        p: [
          "Hidden costs are where Python solutions go wrong. A loop that looks O(n) is O(n^2) if it calls `x in some_list` or `lst.pop(0)` inside.",
          "Key costs: `append` O(1), `pop()` O(1), `pop(0)` and `insert(0, x)` O(n), `x in list` O(n), `x in set` / `d[key]` O(1) average, slicing `a[i:j]` O(k) because it copies k items, `sort` O(n log n), `min`/`max`/`sum` O(n), `heappush`/`heappop` O(log n)."
        ],
        code: `COSTS = [
    ("lst.append(x)", "O(1) amortized"),
    ("lst.pop()", "O(1)"),
    ("lst.pop(0), lst.insert(0, x)", "O(n), use deque"),
    ("x in lst", "O(n)"),
    ("x in st, d[key]", "O(1) average"),
    ("lst[a:b]", "O(k), k = b - a, it copies"),
    ("lst.sort(), sorted(lst)", "O(n log n)"),
    ("min, max, sum", "O(n)"),
    ("heappush, heappop", "O(log n)"),
    ("len(lst)", "O(1)"),
]
for op, cost in COSTS:
    print(op + ": " + cost)`,
        out: `lst.append(x): O(1) amortized
lst.pop(): O(1)
lst.pop(0), lst.insert(0, x): O(n), use deque
x in lst: O(n)
x in st, d[key]: O(1) average
lst[a:b]: O(k), k = b - a, it copies
lst.sort(), sorted(lst): O(n log n)
min, max, sum: O(n)
heappush, heappop: O(log n)
len(lst): O(1)`
      },
      {
        h: "See it: list vs set membership",
        p: [
          "Same loop, same answer, very different speed. Each `x in data_list` scans the list; each `x in data_set` is one hash lookup.",
          "This is the single most common fix in Easy/Medium problems: turn a list into a set (or dict) before the loop."
        ],
        code: `import time

n = 20000
data_list = list(range(n))
data_set = set(data_list)

start = time.perf_counter()
hits = sum(1 for x in range(0, n, 10) if x in data_list)
t_list = time.perf_counter() - start

start = time.perf_counter()
hits2 = sum(1 for x in range(0, n, 10) if x in data_set)
t_set = time.perf_counter() - start

print(hits == hits2, "list is slower:", t_list > t_set)`,
        out: `True list is slower: True`
      },
      {
        h: "Space complexity and the 2-minute routine",
        p: [
          "Space counts extra memory you allocate, not the input. A `seen` set of up to n items is O(n). A few variables is O(1). Recursion uses O(depth) stack space, e.g. O(h) for a tree of height h.",
          "2-minute routine: (1) find the loops and what they range over, (2) multiply nested loops, add sequential ones, (3) add hidden costs of operations inside the loop, (4) note the biggest data structure you build, (5) say it out loud: \"O(n log n) time for the sort, O(n) space for the map.\"",
          "If there are two inputs, use two variables: O(n + m), O(n * m). Don't merge them into one n."
        ]
      }
    ],
    example: {
      name: "Two Sum: brute force vs hashmap complexity",
      n: 3,
      steps: [
        "Brute force: two nested loops over n, so O(n^2) time, O(1) space. With n = 10^4 that is 10^8 steps: too slow in Python.",
        "Hashmap: one loop, each step does an O(1) dict lookup and insert, so O(n) time and O(n) space.",
        "Trade-off to say out loud: we spend O(n) memory to remove the inner loop."
      ],
      code: `def two_sum_brute(nums, target):
    n = len(nums)
    for i in range(n):
        for j in range(i + 1, n):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []

def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []

print(two_sum_brute([2, 7, 11, 15], 9), two_sum([2, 7, 11, 15], 9))`
    },
    mistakes: [
      "Calling an O(n) operation (`in list`, `pop(0)`, slicing, `min`) inside a loop and calling the result O(n).",
      "Forgetting the recursion stack when stating space complexity.",
      "Saying O(n) when there are two independent inputs. Use O(n + m) or O(n * m).",
      "Ignoring the constraints. n <= 10^5 rules out O(n^2) before you start coding.",
      "Counting the output list as extra space without saying so. State whether you include it."
    ],
    practice: [],
    quiz: [
      {
        q: "Constraints say n <= 10^5. Which complexity should you aim for?",
        options: ["O(n^2)", "O(n log n) or better", "O(2^n)", "O(n^3)"],
        answer: 1,
        why: "n^2 is 10^10 steps, far too slow. O(n log n) is about 1.7 million steps."
      },
      {
        q: "What is the time complexity of this loop: `for x in a: if x in b: ...` where a and b are lists of size n?",
        options: ["O(n)", "O(n log n)", "O(n^2)", "O(1)"],
        answer: 2,
        why: "`x in b` scans a list, O(n), and it runs n times. Converting b to a set makes it O(n)."
      },
      {
        q: "Which operation is O(n) on a Python list?",
        options: ["lst.append(x)", "lst.pop()", "lst.pop(0)", "len(lst)"],
        answer: 2,
        why: "Popping the front shifts every remaining element left by one."
      }
    ]
  },

  {
    id: "solve-method",
    track: "Interview",
    order: 25,
    week: 3,
    title: "How to solve a problem in an interview (the 7-step method)",
    minutes: 35,
    goal: "After this lesson you can work through any coding question in a fixed order: clarify, examples, brute force, pattern, plan, code, test.",
    why: "Interviewers grade the process as much as the final code. A candidate who talks through a clear method and tests their code beats one who silently writes a perfect answer.",
    sections: [
      {
        h: "Steps 1 and 2: understand, clarify, write examples",
        p: [
          "Step 1: restate the problem in your own words and ask questions. Input types and size? Negatives? Duplicates? Sorted? Is there always an answer? Return indexes or values? Can I modify the input?",
          "For Two Sum: \"Return indexes of two different elements that add to target. Exactly one answer exists. n up to 10^4, values can be negative. I can't use the same index twice.\"",
          "Step 2: write 2 or 3 examples before coding, including edge cases: smallest input, duplicates (`[3, 3]`, target 6), negatives, the answer at the very end. Writing them as test data lets you run them at the end."
        ],
        code: `tests = [
    ([2, 7, 11, 15], 9, [0, 1]),
    ([3, 2, 4], 6, [1, 2]),
    ([3, 3], 6, [0, 1]),
    ([-1, -2, -3, -4, -5], -8, [2, 4]),
]
for nums, target, expected in tests:
    print(nums, target, "->", expected)`,
        out: `[2, 7, 11, 15] 9 -> [0, 1]
[3, 2, 4] 6 -> [1, 2]
[3, 3] 6 -> [0, 1]
[-1, -2, -3, -4, -5] -8 -> [2, 4]`
      },
      {
        h: "Step 3: brute force first, with its complexity",
        p: [
          "Say the simplest correct solution out loud, even if it is slow. It proves you understand the problem and gives you a fallback.",
          "Two Sum brute force: try every pair i < j. O(n^2) time, O(1) space. With n = 10^4 that is about 5 * 10^7 pairs: borderline in Python, so look for better.",
          "You usually don't need to code the brute force. Ask: \"Should I code this or go for something faster?\""
        ],
        code: `def two_sum_brute(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []

print(two_sum_brute([3, 2, 4], 6))`,
        out: `[1, 2]`
      },
      {
        h: "Step 4: find the pattern",
        p: [
          "Look at what the brute force repeats. In Two Sum, for each x the inner loop searches for `target - x`. Repeated searching means: use a hashmap.",
          "Signals to look for: sorted input -> two pointers or binary search. \"Contiguous subarray/substring\" -> sliding window or prefix sums. \"Top k\" / \"kth largest\" -> heap. \"All combinations/permutations\" -> backtracking. \"Number of ways\" / \"min cost\" with overlapping choices -> DP. Grid or network -> BFS/DFS. Matching brackets or \"next greater\" -> stack.",
          "Say the improvement and its cost: \"Store each value's index in a dict, then the lookup is O(1). O(n) time, O(n) space.\""
        ]
      },
      {
        h: "Steps 5 and 6: plan, then code",
        p: [
          "Step 5: write the plan as 3 to 5 comment lines and get a nod from the interviewer before coding. It catches mistakes when they are cheap.",
          "Step 6: code from the plan. Use clear names (`seen`, `need`), not `d` and `t2`. Keep talking briefly as you write.",
          "Detail that matters in Two Sum: check `need in seen` before inserting `x`. Otherwise `[3, 2, 4]` with target 6 would match 3 with itself."
        ],
        code: `def two_sum(nums, target):
    # plan:
    # 1. seen = {} maps value -> index
    # 2. for each i, x: need = target - x
    # 3. if need in seen: return [seen[need], i]
    # 4. else store seen[x] = i
    seen = {}
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
    return []

print(two_sum([2, 7, 11, 15], 9))`,
        out: `[0, 1]`
      },
      {
        h: "Step 7: test by dry run, then run the examples",
        p: [
          "Walk through one example line by line, saying the variable values. Interviewers want to see you find your own bugs.",
          "Then check edge cases from step 2: duplicates, negatives, smallest input. Finish with the final complexity: \"O(n) time, O(n) space.\"",
          "The trace below is what your dry run should sound like."
        ],
        code: `def two_sum_trace(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        need = target - x
        print("i=" + str(i), "x=" + str(x), "need=" + str(need), "seen=" + str(seen))
        if need in seen:
            return [seen[need], i]
        seen[x] = i
    return []

print(two_sum_trace([3, 2, 4], 6))`,
        out: `i=0 x=3 need=3 seen={}
i=1 x=2 need=4 seen={3: 0}
i=2 x=4 need=2 seen={3: 0, 2: 1}
[1, 2]`
      }
    ],
    template: `def solve(nums, target):
    # 1. clarify: input size, negatives, duplicates, sorted?, always an answer?
    # 2. examples: normal, smallest, duplicates, negatives
    # 3. brute force + Big-O (say it)
    # 4. pattern: what does the brute force repeat?
    # 5. plan as comments, 6. code
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []

# 7. test
tests = [
    (([2, 7, 11, 15], 9), [0, 1]),
    (([3, 2, 4], 6), [1, 2]),
    (([3, 3], 6), [0, 1]),
]
for args, expected in tests:
    got = solve(*args)
    print(got, "OK" if got == expected else "FAIL")`,
    example: {
      name: "Two Sum, all 7 steps",
      n: 3,
      steps: [
        "1. Clarify: return two different indexes whose values sum to target; exactly one answer; values may be negative; n up to 10^4.",
        "2. Examples: [2,7,11,15], 9 -> [0,1]; [3,2,4], 6 -> [1,2] (don't reuse index 0); [3,3], 6 -> [0,1] (duplicates).",
        "3. Brute force: all pairs, O(n^2) time, O(1) space.",
        "4. Pattern: the inner loop searches for `target - x`; a dict of value -> index makes that O(1). Complement hashmap.",
        "5. Plan: for each i, x: need = target - x; if need in seen return [seen[need], i]; else seen[x] = i.",
        "6. Code it (below).",
        "7. Test: dry-run [3,2,4]; check duplicates and negatives; state O(n) time, O(n) space."
      ],
      code: `def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
    return []

tests = [
    ([2, 7, 11, 15], 9, [0, 1]),
    ([3, 2, 4], 6, [1, 2]),
    ([3, 3], 6, [0, 1]),
    ([-1, -2, -3, -4, -5], -8, [2, 4]),
]
for nums, target, expected in tests:
    got = two_sum(nums, target)
    print(got, got == expected)`
    },
    mistakes: [
      "Coding immediately without clarifying. You may solve the wrong problem (values vs indexes, sorted vs unsorted).",
      "Silence. Say what you are thinking, especially when stuck: \"I'm considering a hashmap because...\"",
      "Skipping the brute force. Even one sentence on it shows understanding and gives a fallback.",
      "Declaring \"done\" without a dry run. Find your own off-by-one before the interviewer does.",
      "Forgetting to state final time and space complexity.",
      "Not testing edge cases: empty input, one element, duplicates, negatives."
    ],
    practice: [3],
    quiz: [
      {
        q: "What should you do right after reading the problem?",
        options: ["Start coding the optimal solution", "Restate it and ask clarifying questions", "Ask for the solution", "Write tests for 10 minutes"],
        answer: 1,
        why: "Clarifying catches misunderstandings early: input size, duplicates, return format."
      },
      {
        q: "The problem says \"longest contiguous substring with ...\". Which pattern is the first guess?",
        options: ["Heap", "Sliding window", "Backtracking", "Union-find"],
        answer: 1,
        why: "Contiguous subarray or substring with a condition is the classic sliding-window signal."
      },
      {
        q: "In Two Sum, why check `need in seen` before `seen[x] = i`?",
        options: ["It is faster", "So an element is never paired with itself", "Dicts require it", "To keep the output sorted"],
        answer: 1,
        why: "If x is inserted first, x = target / 2 would find itself and return the same index twice."
      }
    ]
  },

  {
    id: "sd-basics",
    track: "Interview",
    order: 26,
    week: 7,
    title: "System design basics: the building blocks",
    minutes: 60,
    goal: "After this lesson you can explain the main building blocks of a backend system and structure a 45-minute system design answer.",
    why: "Backend and AI roles at 20 LPA+ often include a system design or \"design the backend of your project\" round, even for freshers. Knowing the vocabulary and trade-offs is enough to pass at this level.",
    sections: [
      {
        h: "Client-server, latency vs throughput, and quick estimates",
        p: [
          "A client (browser, app) sends a request over the network to a server, which talks to a database and returns a response. Your FastAPI or Node app is the server.",
          "Latency is how long one request takes (e.g. 120 ms). Throughput is how many requests per second the system handles (e.g. 5,000 QPS). You can improve one and hurt the other: batching raises throughput but adds latency.",
          "Back-of-envelope estimates: one day is about 86,400 seconds (round to 10^5). QPS = daily requests / 86,400. Peak is often 2 to 3x average. Storage = writes per day * bytes per write * days. Rough numbers: memory read ~100 ns, SSD read ~100 us, same-datacenter round trip ~0.5 ms, cross-continent ~150 ms."
        ],
        code: `DAU = 10_000_000
reads_per_user = 20
writes_per_user = 2
seconds_per_day = 86_400
read_qps = DAU * reads_per_user / seconds_per_day
write_qps = DAU * writes_per_user / seconds_per_day
peak_read_qps = read_qps * 3
bytes_per_write = 1_000
storage_per_year_gb = DAU * writes_per_user * bytes_per_write * 365 / 1e9
print("read QPS:", round(read_qps))
print("peak read QPS:", round(peak_read_qps))
print("write QPS:", round(write_qps))
print("storage per year (GB):", round(storage_per_year_gb))`,
        out: `read QPS: 2315
peak read QPS: 6944
write QPS: 231
storage per year (GB): 7300`
      },
      {
        h: "Scaling and load balancers",
        p: [
          "Vertical scaling: a bigger machine (more CPU/RAM). Simple, but has a ceiling and is a single point of failure.",
          "Horizontal scaling: more machines behind a load balancer. Needs stateless app servers: keep sessions in a shared store like Redis or in a JWT, not in server memory.",
          "A load balancer spreads requests across servers (round robin, least connections, or hashing on user id) and removes unhealthy servers using health checks."
        ],
        code: `from itertools import cycle

servers = ["app-1", "app-2", "app-3"]
next_server = cycle(servers)
for request_id in range(5):
    print("request", request_id, "->", next(next_server))`,
        out: `request 0 -> app-1
request 1 -> app-2
request 2 -> app-3
request 3 -> app-1
request 4 -> app-2`
      },
      {
        h: "Caching: cache-aside, TTL, eviction",
        p: [
          "A cache (Redis, Memcached, in-memory) stores hot data so you skip the slow database. Good for read-heavy data that changes rarely: profiles, product pages, config.",
          "Cache-aside: on read, check the cache; on a miss, read the DB and put the value in the cache. On write, update the DB and delete (invalidate) the cache key.",
          "TTL (time to live) expires entries so stale data doesn't live forever. Eviction decides what to drop when the cache is full; LRU (least recently used) is the common default. The code shows cache-aside with LRU eviction and a TTL, using a fake clock."
        ],
        code: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity, ttl):
        self.capacity = capacity
        self.ttl = ttl
        self.data = OrderedDict()

    def get(self, key, now):
        if key not in self.data:
            return None
        value, expires = self.data[key]
        if now >= expires:
            del self.data[key]
            return None
        self.data.move_to_end(key)
        return value

    def put(self, key, value, now):
        self.data[key] = (value, now + self.ttl)
        self.data.move_to_end(key)
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)

DB = {"u1": "Asha", "u2": "Ravi", "u3": "Dev"}
cache = LRUCache(capacity=2, ttl=60)

def get_user(uid, now):
    value = cache.get(uid, now)
    if value is not None:
        return value + " (cache hit)"
    value = DB[uid]
    cache.put(uid, value, now)
    return value + " (from db)"

print(get_user("u1", now=0))
print(get_user("u1", now=10))
print(get_user("u2", now=20))
print(get_user("u3", now=30))
print(get_user("u1", now=40))
print(get_user("u3", now=100))`,
        out: `Asha (from db)
Asha (cache hit)
Ravi (from db)
Dev (from db)
Asha (from db)
Dev (from db)`
      },
      {
        h: "Databases: indexes, replication, sharding",
        p: [
          "Index: a sorted structure (usually a B-tree) on a column so `WHERE email = ...` is O(log n) instead of a full table scan. Indexes speed up reads but slow down writes and use disk. Index the columns you filter and join on.",
          "Replication: copies of the database. One primary takes writes; read replicas serve reads. Improves read throughput and survives a machine failure, but replicas may lag slightly (eventual consistency).",
          "Sharding: split data across machines by a key, e.g. `hash(user_id) % N`. Needed when one machine can't hold the data or the writes. Cost: cross-shard queries are hard, and with plain modulo, changing N moves most keys. Consistent hashing reduces that. SQL (Postgres) for structured data with joins and transactions; NoSQL (DynamoDB, Cassandra, MongoDB) for huge scale with simple access patterns."
        ],
        code: `import hashlib
from collections import Counter

def shard_for(key, num_shards):
    h = int(hashlib.md5(key.encode()).hexdigest(), 16)
    return h % num_shards

for user in ["user1", "user2", "user4"]:
    print(user, "-> shard", shard_for(user, 4))

keys = ["user" + str(i) for i in range(1000)]
print(sorted(Counter(shard_for(k, 4) for k in keys).items()))
moved = sum(1 for k in keys if shard_for(k, 4) != shard_for(k, 5))
print("keys moved when going from 4 to 5 shards:", moved, "of 1000")`,
        out: `user1 -> shard 1
user2 -> shard 0
user4 -> shard 2
[(0, 216), (1, 248), (2, 279), (3, 257)]
keys moved when going from 4 to 5 shards: 795 of 1000`
      },
      {
        h: "Queues, rate limiting, CDN",
        p: [
          "Message queue (Kafka, RabbitMQ, SQS, Redis streams): the API puts a job on the queue and returns fast; workers process it in the background. Use it for emails, video processing, ML inference jobs, anything slow or bursty. It also absorbs traffic spikes and lets you retry failures.",
          "Rate limiting protects your service from abuse. The token bucket algorithm: each user has a bucket of tokens that refills at a fixed rate; each request spends one token; no token means HTTP 429.",
          "CDN (Cloudflare, CloudFront): servers near the user cache static files (images, JS, video). Cuts latency and load on your origin server."
        ],
        code: `class TokenBucket:
    def __init__(self, capacity, refill_per_sec):
        self.capacity = capacity
        self.tokens = capacity
        self.refill = refill_per_sec
        self.last = 0.0

    def allow(self, now):
        elapsed = now - self.last
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False

bucket = TokenBucket(capacity=3, refill_per_sec=1)
times = [0, 0, 0, 0, 0.5, 1.0, 3.0, 3.0, 3.0]
print([bucket.allow(t) for t in times])`,
        out: `[True, True, True, False, False, True, True, True, False]`
      },
      {
        h: "The 45-minute answer template",
        p: [
          "0-5 min, requirements: functional (what users do: post, feed, search) and non-functional (scale, latency, availability vs consistency). Ask, don't assume.",
          "5-10 min, estimates: users, QPS, peak, storage. Decide if it is read-heavy or write-heavy.",
          "10-15 min, API and data model: main endpoints (`POST /urls`, `GET /{code}`) and tables or documents with their keys.",
          "15-25 min, high-level design: client -> load balancer -> app servers -> cache -> database, plus queue/workers and CDN if needed. Draw boxes and arrows and walk one request through.",
          "25-40 min, deep dive on 1 or 2 parts the interviewer cares about: scaling the DB (replicas, sharding), cache strategy, hot keys, failure handling. Always state the trade-off.",
          "40-45 min, wrap up: bottlenecks, what you would monitor (latency p99, error rate, queue depth), what you'd do next."
        ]
      }
    ],
    mistakes: [
      "Drawing boxes before asking for requirements and scale.",
      "Adding Kafka, microservices and sharding to a system with 1,000 users. Size the design to the numbers.",
      "Naming components without the trade-off: every cache needs an invalidation story, every replica has lag.",
      "Keeping session state in app server memory and then scaling horizontally.",
      "Forgetting failure cases: what happens when the cache or a worker goes down?",
      "Going silent while thinking. System design is a conversation; check in with the interviewer every few minutes."
    ],
    practice: [],
    quiz: [
      {
        q: "Your app has 50 reads for every write and DB reads are slow. What is the first thing to add?",
        options: ["Sharding", "A cache (cache-aside) and read replicas", "A message queue", "A bigger frontend bundle"],
        answer: 1,
        why: "Read-heavy load is solved first by caching hot data and spreading reads over replicas. Sharding is for when a single primary can't handle writes or data size."
      },
      {
        q: "What does a load balancer need from app servers to scale horizontally?",
        options: ["They must share one CPU", "They must be stateless (sessions stored outside the server)", "They must use NoSQL", "They must run on a CDN"],
        answer: 1,
        why: "If any server can handle any request, the load balancer can send traffic anywhere and add or remove servers freely."
      },
      {
        q: "10 million users each make 10 requests per day. Roughly what is the average QPS?",
        options: ["About 100", "About 1,000", "About 10,000", "About 1,000,000"],
        answer: 1,
        why: "10^8 requests / ~10^5 seconds = ~1,000 QPS (about 1,157 exactly)."
      }
    ]
  },

  {
    id: "project-story",
    track: "Interview",
    order: 27,
    week: 2,
    title: "Explaining your project and experience (STAR + 2-minute pitch)",
    minutes: 40,
    goal: "After this lesson you can give a clear 2-minute pitch of your background and tell 2 project stories in STAR format with real numbers and trade-offs.",
    why: "Almost every interview opens with \"tell me about yourself\" or \"walk me through a project\". For a fresher, this is where you show ownership and depth, and it sets the tone for the rest of the round.",
    sections: [
      {
        h: "What interviewers are checking",
        p: [
          "They want to know: what did you personally build, why was it hard, what decisions did you make and why, and what changed because of your work.",
          "They will dig into whatever you mention. Only mention things you can explain two levels deep: why you chose FastAPI, how the data is stored, what broke and how you fixed it.",
          "Fill every [placeholder] below with your real numbers. If you don't know a number, estimate it honestly and say \"roughly\". Never invent metrics you can't defend."
        ]
      },
      {
        h: "The 2-minute pitch",
        p: [
          "Structure: who you are (1 line) -> most relevant experience (3-4 lines) -> second project (2 lines) -> what you want next (1 line). Practise it aloud with a timer until it is 90 to 120 seconds.",
          "Example: \"I'm Hariom, a 2026 B.Tech CSE graduate. I work across backend and AI data systems.\"",
          "\"Most recently I interned at Addverb in robotics, on data collection for vision-language-action (VLA) models. I built [the recording and validation pipeline] that captured [camera frames, robot joint states and the language instruction] for each episode, synced them by timestamp, and stored them in [format] for training. It handled [X] episodes and cut bad or unusable episodes by [Y]%.\"",
          "\"Before that I built PureWashr, a full-stack [laundry booking] app with React on the frontend and [Node / FastAPI] with [Postgres / MongoDB] on the backend. I owned [booking, payments and the admin dashboard], used by [N] users.\"",
          "\"I'm looking for a backend or AI engineering role where I can work on data-heavy systems like these.\""
        ]
      },
      {
        h: "STAR: Situation, Task, Action, Result",
        p: [
          "Situation (1-2 lines): the context. Task (1 line): what you were responsible for. Action (most of the time, 4-6 lines): what YOU did, with technical decisions and why. Result (1-2 lines): a number or concrete outcome, plus what you learned.",
          "Use \"I\" for your own work, \"we\" only for team work. Interviewers can't hire your team.",
          "Spend about 60% of the story on Action. That is where your engineering judgement shows."
        ]
      },
      {
        h: "Example STAR: Addverb VLA data collection",
        p: [
          "Situation: \"The robotics team was training a vision-language-action model and needed many clean demonstration episodes. Data was being recorded with [manual scripts], and about [Z]% of episodes had missing frames or out-of-sync joint data.\"",
          "Task: \"I was asked to make data collection reliable and faster for [the teleoperation setup].\"",
          "Action: \"I wrote a recorder that [subscribed to the camera and joint-state streams] and attached a common timestamp to every message. I added a validation step after each episode that checked [frame rate, missing frames, timestamp gaps over N ms, and that the instruction text was present] and flagged bad episodes immediately so the operator could re-record. I stored episodes in [HDF5 / a folder per episode with a JSON manifest] so the training team could load them directly. I chose [X] over [Y] because [reason, e.g. faster sequential reads].\"",
          "Result: \"Collection went from [A] to [B] episodes per hour, unusable episodes dropped from [Z]% to [W]%, and the dataset reached [X] episodes used to train [model]. I learned to validate data at the point of capture instead of at training time.\"",
          "Likely follow-ups to prepare: How did you sync streams with different rates? What happened when a camera dropped frames? How large was the dataset and where was it stored? What would you change now?"
        ]
      },
      {
        h: "Example STAR: PureWashr full-stack",
        p: [
          "Situation: \"PureWashr is a [laundry pickup and delivery] service. Bookings were handled [over phone / WhatsApp], which caused [missed slots and double bookings].\"",
          "Task: \"I built the web app end to end: customer booking, payments and an admin dashboard.\"",
          "Action: \"I built the frontend in React and the API in [Node / FastAPI] with [Postgres]. To prevent double booking I [used a unique constraint on (slot_id, date) / a transaction with row locking]. I integrated [Razorpay] with webhooks to confirm payments server-side instead of trusting the client. I added [JWT auth, role-based access for admins, and an index on bookings by date] because the admin dashboard queried by date range.\"",
          "Result: \"It handled [N] bookings in the first [month], double bookings went to [zero], and admin time per day dropped by about [X] hours.\"",
          "Likely follow-ups: How did you handle a payment webhook arriving twice (idempotency)? How would you scale it to 100x users? What was your schema? What was the hardest bug?"
        ]
      },
      {
        h: "Prepare and practise",
        p: [
          "Write each story as 5 bullet points, not a script, so you sound natural.",
          "For each project prepare: one hard bug, one trade-off you made, one thing you would do differently, and the numbers (data size, users, latency, time saved).",
          "Record yourself once on your phone. Cut filler, check you stay under 2 minutes for the pitch and about 3 minutes per STAR story.",
          "Prepare short STAR stories for the common behavioural questions too: a conflict, a failure, a tight deadline, learning something new fast. The Addverb and PureWashr stories can usually be reused for these."
        ]
      }
    ],
    mistakes: [
      "Listing technologies (\"I used React, Node, MongoDB, Redis\") instead of explaining problems and decisions.",
      "Saying \"we\" for everything, so the interviewer can't tell what you did.",
      "No result or number. Even \"roughly 30% fewer bad episodes\" is better than nothing, as long as you can explain it.",
      "Mentioning a technology you can't answer follow-up questions about.",
      "A 6-minute rambling pitch. Keep it to 2 minutes and let them ask for more.",
      "Making up metrics. Interviewers probe numbers; use honest estimates and say they are estimates."
    ],
    practice: [],
    quiz: [
      {
        q: "In a STAR story, which part should take the most time?",
        options: ["Situation", "Task", "Action", "Result"],
        answer: 2,
        why: "Action is where you show your own decisions and engineering judgement."
      },
      {
        q: "Which result line is strongest?",
        options: ["\"It went well.\"", "\"The team liked it.\"", "\"Unusable episodes dropped from about 20% to 5%, and collection speed doubled.\"", "\"I used Python.\""],
        answer: 2,
        why: "A concrete, measurable outcome you can explain is far more convincing than a vague one."
      },
      {
        q: "How long should your \"tell me about yourself\" pitch be?",
        options: ["15 seconds", "About 2 minutes", "5 to 10 minutes", "As long as needed to cover every project"],
        answer: 1,
        why: "About 90 to 120 seconds covers who you are, your best experience and what you want, and leaves room for questions."
      }
    ]
  }
);
