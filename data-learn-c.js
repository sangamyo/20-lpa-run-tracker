window.LESSONS = window.LESSONS || [];
window.LESSONS.push(
  // ------------------------------------------------------------------ 16
  {
    id: "tries",
    track: "Patterns",
    order: 16,
    week: 7,
    title: "Tries (prefix trees)",
    minutes: 45,
    goal: "After this lesson you can build a trie from scratch and use it to answer word, prefix and wildcard queries in time proportional to the word length.",
    why: "Tries show up in autocomplete, spell-check and 'search many words at once' questions. Interviewers like Implement Trie because it tests whether you can design a small class cleanly.",
    sections: [
      {
        h: "What a trie is",
        p: [
          "A trie is a tree where each edge is one character. A path from the root spells a prefix. Words that share a prefix share the same path, so 'car', 'cat' and 'cart' all start with the nodes c -> a.",
          "Each node needs only two things: `children`, a dict from character to child node, and `end`, a flag that says 'a word finishes here'. Without `end` you cannot tell the word 'car' apart from the prefix 'car' of 'cart'.",
          "Insert and search both walk one node per character, so they cost O(L) where L is the word length, no matter how many words are stored."
        ],
        code: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.end = False

root = TrieNode()
for word in ["car", "cat", "cart"]:
    node = root
    for ch in word:
        if ch not in node.children:
            node.children[ch] = TrieNode()
        node = node.children[ch]
    node.end = True

node = root.children["c"].children["a"]
print(sorted(node.children.keys()))
print(node.children["r"].end, node.children["t"].end)`,
        out: "['r', 't']\nTrue True"
      },
      {
        h: "How to recognise it",
        p: [
          "The problem says 'prefix', 'starts with', 'autocomplete' or 'dictionary of words'.",
          "You must check many words against the same input (a board, a stream, a sentence) and checking each word separately would repeat work.",
          "You are asked to design a class with `insert` and `search` methods over strings.",
          "There is a wildcard like '.' that can match any letter: a trie plus DFS handles this.",
          "If the question only asks 'is this exact word in the list', a plain `set` is simpler. Use a trie when prefixes matter."
        ]
      },
      {
        h: "Wildcard search: trie + DFS",
        p: [
          "In Design Add and Search Words (82), '.' matches any single letter. At a normal letter you follow one child. At a '.' you must try every child, which is a small DFS.",
          "The recursion `dfs(node, i)` means: can the rest of the word starting at index `i` be matched from this node? The base case is `i == len(word)`, and the answer is `node.end`."
        ],
        code: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.end = False

class WordDictionary:
    def __init__(self):
        self.root = TrieNode()

    def add_word(self, word):
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.end = True

    def search(self, word):
        def dfs(node, i):
            if i == len(word):
                return node.end
            ch = word[i]
            if ch == ".":
                for child in node.children.values():
                    if dfs(child, i + 1):
                        return True
                return False
            if ch not in node.children:
                return False
            return dfs(node.children[ch], i + 1)
        return dfs(self.root, 0)

wd = WordDictionary()
for w in ["bad", "dad", "mad"]:
    wd.add_word(w)
print(wd.search("pad"), wd.search("bad"), wd.search(".ad"), wd.search("b.."))`,
        out: "False True True True"
      },
      {
        h: "Trie + grid DFS: Word Search II",
        p: [
          "Word Search II (83) asks which of many words appear in a letter grid. Running Word Search once per word is too slow. Instead, put all words in a trie and run one DFS from each cell, walking the trie at the same time.",
          "If the current letters are not a prefix in the trie, stop immediately. That pruning is the whole speed-up.",
          "Store the full word at its end node (`node.word = w`) so you can collect it directly, then set it to `None` so it is not reported twice. Deleting empty leaf nodes after use makes it faster still."
        ],
        code: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.word = None

def find_words(board, words):
    root = TrieNode()
    for w in words:
        node = root
        for ch in w:
            node = node.children.setdefault(ch, TrieNode())
        node.word = w
    rows, cols = len(board), len(board[0])
    found = []

    def dfs(r, c, node):
        ch = board[r][c]
        nxt = node.children.get(ch)
        if nxt is None:
            return
        if nxt.word is not None:
            found.append(nxt.word)
            nxt.word = None
        board[r][c] = "#"
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != "#":
                dfs(nr, nc, nxt)
        board[r][c] = ch
        if not nxt.children and nxt.word is None:
            del node.children[ch]

    for r in range(rows):
        for c in range(cols):
            dfs(r, c, root)
    return found

board = [list("oaan"), list("etae"), list("ihkr"), list("iflv")]
print(sorted(find_words(board, ["oath", "pea", "eat", "rain"])))`,
        out: "['eat', 'oath']"
      }
    ],
    template: `class TrieNode:
    def __init__(self):
        self.children = {}   # char -> TrieNode
        self.end = False     # True if a word ends here

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.end = True

    def _walk(self, s):
        node = self.root
        for ch in s:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node

    def search(self, word):
        node = self._walk(word)
        return node is not None and node.end

    def starts_with(self, prefix):
        return self._walk(prefix) is not None

t = Trie()
t.insert("dog")
print(t.search("dog"), t.search("do"), t.starts_with("do"))`,
    example: {
      name: "Implement Trie",
      n: 81,
      steps: [
        "We need `insert`, `search` (exact word) and `startsWith` (any word with this prefix).",
        "Node design: `children = {}` and `end = False`. The root is an empty node that represents the empty prefix.",
        "Both search and startsWith walk the same path, so write one helper `_walk(s)` that returns the node reached after reading `s`, or `None` if some character is missing.",
        "search returns True only if the walk succeeds AND `node.end` is True. startsWith returns True if the walk succeeds at all.",
        "Dry run: insert('apple') creates a -> p -> p -> l -> e and marks e as end.",
        "search('apple'): walk reaches e, end is True -> True.",
        "search('app'): walk reaches the second p, but its end is False -> False.",
        "startsWith('app'): walk succeeds -> True.",
        "insert('app'): walk reuses existing nodes and just sets end = True on the second p. Now search('app') -> True.",
        "Time: O(L) per operation. Space: O(total characters inserted)."
      ],
      code: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.end = True

    def _walk(self, s):
        node = self.root
        for ch in s:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node

    def search(self, word):
        node = self._walk(word)
        return node is not None and node.end

    def startsWith(self, prefix):
        return self._walk(prefix) is not None

trie = Trie()
trie.insert("apple")
print(trie.search("apple"))
print(trie.search("app"))
print(trie.startsWith("app"))
trie.insert("app")
print(trie.search("app"))`
    },
    mistakes: [
      "Forgetting the `end` flag, so a prefix like 'app' is wrongly reported as a full word.",
      "Creating a new TrieNode on every character even when the child already exists, which wipes out earlier words. Use `setdefault` or check `in` first.",
      "In wildcard search, returning the result of the first child for '.' instead of trying all children until one returns True.",
      "In Word Search II, not marking the cell as visited (for example with '#') and then reusing the same cell twice in one word.",
      "In Word Search II, adding the same word twice because you did not clear `node.word` after finding it."
    ],
    practice: [81, 82, 83],
    quiz: [
      {
        q: "You inserted only 'cart' into a trie. What does `search('car')` return?",
        options: ["True, because the path c-a-r exists", "False, because the node for 'r' has end = False", "It raises KeyError"],
        answer: 1,
        why: "The path exists, but no word was marked as ending at 'r'. search needs both the path and the end flag."
      },
      {
        q: "What is the time cost of inserting a word of length L into a trie that already holds N words?",
        options: ["O(N)", "O(L)", "O(N * L)", "O(log N)"],
        answer: 1,
        why: "You visit one node per character of the word. The number of stored words does not matter."
      },
      {
        q: "In Design Add and Search Words, what should search do when it meets a '.'?",
        options: ["Skip the character and continue with the same node", "Try every child node and return True if any branch matches", "Return False because '.' is never stored"],
        answer: 1,
        why: "'.' can be any letter, so every child is a possible match. That is a DFS over all children."
      }
    ]
  },

  // ------------------------------------------------------------------ 17
  {
    id: "heaps",
    track: "Patterns",
    order: 17,
    week: 7,
    title: "Heaps and top-k problems",
    minutes: 55,
    goal: "After this lesson you can use Python's `heapq` to solve top-k, k-th largest, merge-k and running-median problems, including max-heaps and tie-breaks.",
    why: "Top-k and 'k-th largest' questions are among the most common OA problems. A heap turns an O(n log n) sort into O(n log k), and interviewers expect you to know that trade-off.",
    sections: [
      {
        h: "heapq basics in Python",
        p: [
          "A heap is a list kept in a special order so the smallest item is always at index 0. Python's `heapq` module only gives a min-heap.",
          "`heapq.heappush(h, x)` and `heapq.heappop(h)` cost O(log n). `heapq.heapify(list)` turns a list into a heap in O(n). `h[0]` peeks the smallest without removing it.",
          "`heapq.nlargest(k, items)` and `heapq.nsmallest(k, items, key=...)` are handy one-liners when you just need the answer once."
        ],
        code: `import heapq

nums = [5, 1, 8, 3, 2]
heapq.heapify(nums)
print(nums[0])
heapq.heappush(nums, 0)
print(heapq.heappop(nums), heapq.heappop(nums))
print(heapq.nlargest(2, [5, 1, 8, 3, 2]))`,
        out: "1\n0 1\n[8, 5]"
      },
      {
        h: "Max-heap by negating",
        p: [
          "To get the largest item first, push `-x` instead of `x`, and negate again when you pop. This is the standard Python trick.",
          "Last Stone Weight (85) needs the two heaviest stones every round, so it is a max-heap problem."
        ],
        code: `import heapq

def last_stone_weight(stones):
    heap = [-s for s in stones]
    heapq.heapify(heap)
    while len(heap) > 1:
        a = -heapq.heappop(heap)
        b = -heapq.heappop(heap)
        if a != b:
            heapq.heappush(heap, -(a - b))
    return -heap[0] if heap else 0

print(last_stone_weight([2, 7, 4, 1, 8, 1]))`,
        out: "1"
      },
      {
        h: "How to recognise it",
        p: [
          "The words 'k-th largest', 'k-th smallest', 'top k', 'k closest', 'k most frequent'.",
          "You repeatedly need the current minimum or maximum while items keep being added or removed (a stream, a simulation, 'each round pick the biggest').",
          "You must merge several already sorted lists or streams.",
          "You need a running median: that is the two-heaps pattern.",
          "Shortest path with weights (Dijkstra) also uses a heap; you will see it in the graphs lessons."
        ]
      },
      {
        h: "Size-k heap for top-k",
        p: [
          "To keep the k largest items, keep a MIN-heap of size k. The smallest of your k winners sits at the top, ready to be kicked out when something bigger arrives. The top is then the k-th largest.",
          "To keep the k smallest (or k closest) items, flip it: keep a max-heap of size k by pushing negated keys.",
          "Cost is O(n log k) instead of O(n log n) for sorting everything."
        ],
        code: `import heapq

def k_closest(points, k):
    heap = []
    for x, y in points:
        d = x * x + y * y
        heapq.heappush(heap, (-d, x, y))
        if len(heap) > k:
            heapq.heappop(heap)
    return sorted([[x, y] for _, x, y in heap])

print(k_closest([[3, 3], [5, -1], [-2, 4]], 2))`,
        out: "[[-2, 4], [3, 3]]"
      },
      {
        h: "Tuples, tie-breaks and two heaps",
        p: [
          "Heaps compare tuples item by item. Push `(priority, tiebreak, payload)`. For Top K Frequent Words (90) the key is `(-freq, word)`, so higher frequency wins and equal frequency falls back to alphabetical order.",
          "For Merge k Sorted Lists (64), push `(node.val, i, node)`. The index `i` breaks ties so Python never tries to compare two ListNode objects, which would crash.",
          "For Find Median from Data Stream (89), keep two heaps: `low` is a max-heap (negated) with the smaller half, `high` is a min-heap with the bigger half. Keep `len(low)` equal to `len(high)` or one more. The median is then at the tops.",
          "Task Scheduler (88) and Reorganize String (91) are greedy problems that use counts. Reorganize String uses a max-heap of `(-count, char)` and holds back the previous character for one round."
        ],
        code: `import heapq

class MedianFinder:
    def __init__(self):
        self.low = []   # max-heap via negation, smaller half
        self.high = []  # min-heap, bigger half

    def add_num(self, num):
        heapq.heappush(self.low, -num)
        heapq.heappush(self.high, -heapq.heappop(self.low))
        if len(self.high) > len(self.low):
            heapq.heappush(self.low, -heapq.heappop(self.high))

    def find_median(self):
        if len(self.low) > len(self.high):
            return float(-self.low[0])
        return (-self.low[0] + self.high[0]) / 2

mf = MedianFinder()
for x in [5, 2, 8, 1]:
    mf.add_num(x)
    print(mf.find_median())`,
        out: "5.0\n3.5\n5.0\n3.5"
      }
    ],
    template: `import heapq

def top_k_largest(nums, k):
    heap = []                      # min-heap holding the k largest so far
    for x in nums:
        if len(heap) < k:
            heapq.heappush(heap, x)
        elif x > heap[0]:
            heapq.heapreplace(heap, x)   # pop smallest, push x
    return heap[0]                 # k-th largest

print(top_k_largest([3, 2, 1, 5, 6, 4], 2))`,
    example: {
      name: "Kth Largest Element in a Stream",
      n: 84,
      steps: [
        "We get numbers one at a time and after each `add` must return the k-th largest seen so far.",
        "Signal: 'k-th largest' plus a stream. Keep a min-heap of size k. Its top is the k-th largest.",
        "On add(val): if the heap has fewer than k items, push. Otherwise, if val is bigger than the top, replace the top with val. If val is smaller or equal, it can never be in the top k, so ignore it.",
        "Dry run with k = 3, nums = [4, 5, 8, 2]: after building, heap holds {4, 5, 8}; 2 was ignored because 2 < 4.",
        "add(3): 3 < 4, ignore -> return 4.",
        "add(5): 5 > 4, replace -> {5, 5, 8} -> return 5.",
        "add(10): 10 > 5, replace -> {5, 8, 10} -> return 5.",
        "add(9): 9 > 5, replace -> {8, 9, 10} -> return 8.",
        "add(4): 4 < 8, ignore -> return 8.",
        "Each add is O(log k). Memory is O(k)."
      ],
      code: `import heapq

class KthLargest:
    def __init__(self, k, nums):
        self.k = k
        self.heap = []
        for x in nums:
            self.add(x)

    def add(self, val):
        if len(self.heap) < self.k:
            heapq.heappush(self.heap, val)
        elif val > self.heap[0]:
            heapq.heapreplace(self.heap, val)
        return self.heap[0]

kl = KthLargest(3, [4, 5, 8, 2])
print([kl.add(v) for v in [3, 5, 10, 9, 4]])`
    },
    mistakes: [
      "Using a max-heap to find the k largest. You want a MIN-heap of size k so the weakest winner is on top and easy to evict.",
      "Forgetting to negate back when popping from a negated max-heap, so you return -8 instead of 8.",
      "Pushing objects that cannot be compared (like ListNode) without a tie-break index in the tuple; Python raises TypeError on equal priorities.",
      "Calling `sorted()` inside a loop on every insert instead of using a heap, turning O(n log k) into O(n^2 log n).",
      "Assuming `heap` is fully sorted. Only `heap[0]` is guaranteed to be the smallest; the rest is only partly ordered."
    ],
    practice: [84, 85, 86, 87, 90, 88, 91, 64, 89],
    quiz: [
      {
        q: "You want the 3 largest numbers from a stream of a million numbers. Which structure fits best?",
        options: ["A max-heap holding all numbers", "A min-heap of size 3", "A sorted list re-sorted after every insert", "A set"],
        answer: 1,
        why: "A min-heap of size 3 keeps only the current top 3 and lets you evict the smallest of them in O(log 3)."
      },
      {
        q: "How do you get max-heap behaviour with Python's heapq?",
        options: ["heapq.heapify(nums, reverse=True)", "Push negated values and negate when popping", "Use heapq.heappop(nums, -1)"],
        answer: 1,
        why: "heapq is min-heap only. Negating turns the largest value into the smallest key."
      },
      {
        q: "For Top K Frequent Words, which key orders 'higher frequency first, then alphabetical'?",
        options: ["(freq, word)", "(-freq, word)", "(word, -freq)", "(-freq, -word)"],
        answer: 1,
        why: "Tuples compare left to right: -freq puts larger counts first, then word sorts ties alphabetically. You cannot negate a string."
      }
    ]
  },

  // ------------------------------------------------------------------ 18
  {
    id: "backtracking",
    track: "Patterns",
    order: 18,
    week: 9,
    title: "Backtracking: subsets, combinations, permutations",
    minutes: 60,
    goal: "After this lesson you can write one backtracking skeleton and adapt it to subsets, combinations, permutations, duplicates and constraint problems like N-Queens.",
    why: "'Generate all ...' questions are common in interviews and they all use the same skeleton. Once you know which three knobs to turn, these problems become routine.",
    sections: [
      {
        h: "The choose, explore, un-choose loop",
        p: [
          "Backtracking builds an answer one choice at a time in a list called `path`. After exploring a choice, you undo it (`path.pop()`) so the next choice starts from a clean state.",
          "For Subsets (92), every node of the recursion tree is a valid subset, so we record `path[:]` at the start of every call. `start` makes sure we only pick elements to the right, so [1, 2] and [2, 1] are not both produced.",
          "Always append a COPY (`path[:]`). If you append `path` itself, every entry in the result points to the same list, which is empty at the end."
        ],
        code: `def subsets(nums):
    res, path = [], []

    def backtrack(start):
        res.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1)
            path.pop()

    backtrack(0)
    return res

print(subsets([1, 2, 3]))`,
        out: "[[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]"
      },
      {
        h: "How to recognise it",
        p: [
          "The problem says 'return all', 'generate all', 'list every possible' subsets, combinations, permutations, partitions or arrangements.",
          "Input size is small (n around 10 to 20). Exponential output is expected, so exponential time is fine.",
          "You place items one by one with rules (N-Queens, Sudoku) and must undo a placement when it leads nowhere.",
          "A grid path that cannot reuse cells (Word Search 97): mark the cell, recurse, unmark.",
          "If the question asks only for a COUNT or a min/max, check whether DP is possible first; backtracking is for listing."
        ]
      },
      {
        h: "Three knobs: start, reuse, duplicates",
        p: [
          "Knob 1, order matters? Combinations and subsets use `start` so you only move forward. Permutations (96) loop over all indices and use a `used` array instead.",
          "Knob 2, reuse allowed? In Combination Sum (94) the same number may be used again, so recurse with `i`. Without reuse (Combination Sum II 95, Combinations 100), recurse with `i + 1`.",
          "Knob 3, duplicates in input? Sort first, then skip a value equal to the one before it at the same level: `if i > start and nums[i] == nums[i - 1]: continue`. This is used in Subsets II (93) and Combination Sum II (95).",
          "Letter Combinations (98) and Palindrome Partitioning (99) use the same loop: the choices at each level are the letters for one digit, or every palindromic prefix of what is left."
        ],
        code: `def subsets_with_dup(nums):
    nums.sort()
    res, path = [], []

    def backtrack(start):
        res.append(path[:])
        for i in range(start, len(nums)):
            if i > start and nums[i] == nums[i - 1]:
                continue
            path.append(nums[i])
            backtrack(i + 1)
            path.pop()

    backtrack(0)
    return res

print(subsets_with_dup([1, 2, 2]))`,
        out: "[[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]"
      },
      {
        h: "Permutations with a used array",
        p: [
          "In a permutation every element is used exactly once and order matters, so there is no `start`. Every level loops over all indices and skips the ones already in `path`.",
          "The answer is recorded only at the leaves, when `len(path) == len(nums)`."
        ],
        code: `def permute(nums):
    res, path = [], []
    used = [False] * len(nums)

    def backtrack():
        if len(path) == len(nums):
            res.append(path[:])
            return
        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            path.append(nums[i])
            backtrack()
            path.pop()
            used[i] = False

    backtrack()
    return res

print(permute([1, 2, 3]))`,
        out: "[[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]"
      },
      {
        h: "Constraint sets: N-Queens",
        p: [
          "In N-Queens (101) you place one queen per row. A placement is illegal if the column or either diagonal is already taken.",
          "Cells on the same main diagonal share `r - c`; cells on the same anti-diagonal share `r + c`. Keep three sets so each check is O(1).",
          "Add to the sets before recursing and remove after: this is the same choose / un-choose idea."
        ],
        code: `def solve_n_queens(n):
    cols, diag1, diag2 = set(), set(), set()
    board = [["."] * n for _ in range(n)]
    res = []

    def backtrack(r):
        if r == n:
            res.append(["".join(row) for row in board])
            return
        for c in range(n):
            if c in cols or (r - c) in diag1 or (r + c) in diag2:
                continue
            cols.add(c)
            diag1.add(r - c)
            diag2.add(r + c)
            board[r][c] = "Q"
            backtrack(r + 1)
            board[r][c] = "."
            cols.remove(c)
            diag1.remove(r - c)
            diag2.remove(r + c)

    backtrack(0)
    return res

for sol in solve_n_queens(4):
    print(sol)`,
        out: "['.Q..', '...Q', 'Q...', '..Q.']\n['..Q.', 'Q...', '...Q', '.Q..']"
      }
    ],
    template: `def backtrack_all(nums):
    res, path = [], []

    def backtrack(start):
        # 1. record or stop
        res.append(path[:])            # copy!
        # 2. try every choice from start
        for i in range(start, len(nums)):
            # optional: skip duplicates at this level (needs nums sorted)
            if i > start and nums[i] == nums[i - 1]:
                continue
            path.append(nums[i])       # choose
            backtrack(i + 1)           # explore (use i if reuse allowed)
            path.pop()                 # un-choose

    nums.sort()
    backtrack(0)
    return res

print(backtrack_all([2, 1]))`,
    example: {
      name: "Combination Sum",
      n: 94,
      steps: [
        "Find all unique combinations of `candidates` that add up to `target`. The same number may be used many times.",
        "Signals: 'all combinations' -> backtracking. 'Same number may be chosen unlimited times' -> recurse with `i`, not `i + 1`.",
        "Track `remaining = target - sum(path)`. If remaining is 0, record a copy of path. Sort candidates first so that once `c > remaining` we can `break` (all later ones are bigger too).",
        "Using `start` keeps combinations in non-decreasing order, so [2, 2, 3] is produced but [3, 2, 2] is not.",
        "Dry run with [2, 3, 6, 7], target 7: path [2] rem 5 -> [2, 2] rem 3 -> [2, 2, 2] rem 1 -> next 2 > 1, break. Back to [2, 2] rem 3 -> try 3 -> [2, 2, 3] rem 0 -> record.",
        "[2, 3] rem 2 -> 3 > 2, break. [2, 6] and [2, 7] break immediately. [3] rem 4 -> [3, 3] rem 1 -> break. [6] rem 1 -> break. [7] rem 0 -> record.",
        "Result: [[2, 2, 3], [7]]."
      ],
      code: `def combination_sum(candidates, target):
    candidates.sort()
    res, path = [], []

    def backtrack(start, remaining):
        if remaining == 0:
            res.append(path[:])
            return
        for i in range(start, len(candidates)):
            c = candidates[i]
            if c > remaining:
                break
            path.append(c)
            backtrack(i, remaining - c)
            path.pop()

    backtrack(0, target)
    return res

print(combination_sum([2, 3, 6, 7], 7))
print(combination_sum([2, 3, 5], 8))`
    },
    mistakes: [
      "Appending `path` instead of `path[:]`, so every saved answer ends up as the same empty list.",
      "Forgetting `path.pop()` (or forgetting to remove from `used` / the sets) after the recursive call.",
      "Using `i + 1` when reuse is allowed, or `i` when it is not. Read the problem statement for 'may be chosen unlimited times'.",
      "Skipping duplicates with `i > 0` instead of `i > start`. That wrongly removes valid answers like [2, 2].",
      "Not sorting before the duplicate-skip check; the check only works when equal values are next to each other.",
      "In Word Search, not restoring the cell after marking it, which breaks later searches."
    ],
    practice: [92, 96, 94, 100, 93, 95, 98, 97, 99, 101],
    quiz: [
      {
        q: "In Combination Sum, numbers can be reused. Which recursive call is correct?",
        options: ["backtrack(i + 1, remaining - c)", "backtrack(i, remaining - c)", "backtrack(0, remaining - c)"],
        answer: 1,
        why: "Passing `i` lets the same number be picked again. Passing 0 would also create reordered duplicates like [3, 2, 2]."
      },
      {
        q: "Why does `res.append(path)` give wrong results?",
        options: ["It is slower than path[:]", "All entries refer to the same list object, which keeps changing", "Lists cannot be appended to lists"],
        answer: 1,
        why: "You store a reference, not a snapshot. After backtracking finishes, path is empty, so all entries show [] ."
      },
      {
        q: "In N-Queens, two queens at (r1, c1) and (r2, c2) are on the same anti-diagonal when ...",
        options: ["r1 - c1 == r2 - c2", "r1 + c1 == r2 + c2", "r1 == c2", "abs(r1 - r2) == 1"],
        answer: 1,
        why: "Moving along an anti-diagonal increases r by 1 and decreases c by 1, so r + c stays the same."
      }
    ]
  },

  // ------------------------------------------------------------------ 19
  {
    id: "graphs-bfs-dfs",
    track: "Patterns",
    order: 19,
    week: 8,
    title: "Graphs: grids, BFS, DFS and topological sort",
    minutes: 75,
    goal: "After this lesson you can turn edge lists and grids into graphs, traverse them with BFS or DFS, find shortest steps in unweighted graphs, and order tasks with topological sort.",
    why: "Graph questions (islands, rotting oranges, course schedule) are a staple of product-company interviews and OAs. Most of them are the same BFS or DFS loop with a small twist.",
    sections: [
      {
        h: "Representing a graph in Python",
        p: [
          "Most problems give an edge list like `[[0, 1], [1, 2]]`. Convert it to an adjacency list: `graph = defaultdict(list)`, then for each edge append both directions if the graph is undirected.",
          "Traversal needs a `seen` set so you never visit a node twice. Without it, a cycle makes you loop forever.",
          "BFS uses `collections.deque` with `popleft()`. Add a node to `seen` when you PUSH it, not when you pop it, otherwise the same node can be queued many times."
        ],
        code: `from collections import defaultdict, deque

def valid_path(n, edges, source, destination):
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)
        graph[v].append(u)
    seen = {source}
    queue = deque([source])
    while queue:
        node = queue.popleft()
        if node == destination:
            return True
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt)
                queue.append(nxt)
    return False

print(valid_path(6, [[0, 1], [0, 2], [3, 5], [5, 4], [4, 3]], 0, 5))
print(valid_path(3, [[0, 1], [1, 2], [2, 0]], 0, 2))`,
        out: "False\nTrue"
      },
      {
        h: "How to recognise it",
        p: [
          "Explicit graph words: nodes, edges, connected, neighbours, network, path between.",
          "A 2-D grid where you move up/down/left/right: islands, regions, flood fill, mazes. Every cell is a node.",
          "'Minimum number of steps / moves / minutes' with equal cost per move: BFS by levels.",
          "Many starting points spreading at the same time (rotting oranges, fire): multi-source BFS, push all sources first.",
          "'Prerequisites', 'order of tasks', 'dependencies', 'is it possible to finish all': topological sort.",
          "Transform one word into another one letter at a time (Word Ladder 114): words are nodes, BFS for fewest steps."
        ]
      },
      {
        h: "Grids are graphs: DFS",
        p: [
          "In a grid, the neighbours of (r, c) are the 4 cells around it. Check bounds before touching a cell.",
          "DFS is easy to write recursively: stop if out of bounds or not the colour you want, otherwise change the cell and recurse on 4 neighbours. Changing the cell acts as the `seen` marker.",
          "Flood Fill (103) has one trap: if the new colour equals the old colour, nothing changes and the recursion never stops, so return early.",
          "Max Area of Island (104) is the same DFS but it returns `1 + sum of the 4 recursive calls`."
        ],
        code: `def flood_fill(image, sr, sc, color):
    old = image[sr][sc]
    if old == color:
        return image
    rows, cols = len(image), len(image[0])

    def dfs(r, c):
        if r < 0 or r >= rows or c < 0 or c >= cols or image[r][c] != old:
            return
        image[r][c] = color
        dfs(r + 1, c)
        dfs(r - 1, c)
        dfs(r, c + 1)
        dfs(r, c - 1)

    dfs(sr, sc)
    return image

print(flood_fill([[1, 1, 1], [1, 1, 0], [1, 0, 1]], 1, 1, 2))`,
        out: "[[2, 2, 2], [2, 2, 0], [2, 0, 1]]"
      },
      {
        h: "BFS levels: shortest steps and multi-source",
        p: [
          "BFS visits nodes in rings: first everything 1 step away, then 2 steps, and so on. So the first time BFS reaches a node is via a shortest path (when every move costs the same).",
          "To count levels, process the queue one level at a time: `for _ in range(len(queue)):` and add 1 after each level.",
          "Rotting Oranges (106): push ALL rotten oranges first, then BFS. Each level is one minute. At the end, if any fresh orange is left, return -1.",
          "Shortest Path in Binary Matrix (116) is the same with 8 directions; check that the start and end cells are open first."
        ],
        code: `from collections import deque

def oranges_rotting(grid):
    rows, cols = len(grid), len(grid[0])
    queue = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1
    minutes = 0
    while queue and fresh > 0:
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr, nc))
        minutes += 1
    return minutes if fresh == 0 else -1

print(oranges_rotting([[2, 1, 1], [1, 1, 0], [0, 1, 1]]))
print(oranges_rotting([[2, 1, 1], [0, 1, 1], [1, 0, 1]]))`,
        out: "4\n-1"
      },
      {
        h: "Topological sort (Kahn's algorithm)",
        p: [
          "For 'course A needs course B first', draw an edge B -> A. A valid order exists only if there is no cycle.",
          "Kahn's algorithm: count `indegree` (number of incoming edges) for every node. Start a queue with all nodes of indegree 0. Pop a node, add it to the order, and decrease the indegree of its neighbours; push any that drop to 0.",
          "If the final order contains all n nodes, there was no cycle. Course Schedule (109) returns `len(order) == n`; Course Schedule II (110) returns the order itself or [] ."
        ],
        code: `from collections import deque

def find_order(num_courses, prerequisites):
    graph = [[] for _ in range(num_courses)]
    indegree = [0] * num_courses
    for course, pre in prerequisites:
        graph[pre].append(course)
        indegree[course] += 1
    queue = deque(i for i in range(num_courses) if indegree[i] == 0)
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nxt in graph[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return order if len(order) == num_courses else []

print(find_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]]))
print(find_order(2, [[1, 0], [0, 1]]))`,
        out: "[0, 1, 2, 3]\n[]"
      },
      {
        h: "Twists you will meet",
        p: [
          "Start from the border or the target instead of every cell. Surrounded Regions (108): DFS from border 'O' cells and mark them safe, then flip every other 'O'. Pacific Atlantic (107): BFS uphill from each ocean's edge, then intersect the two reached sets.",
          "Clone Graph (105): keep a dict `old_to_new`. Create the clone and store it in the dict BEFORE recursing into neighbours, so cycles find the existing clone.",
          "Word Ladder (114): instead of comparing every pair of words, bucket words by patterns like 'h*t'. Words in the same bucket are neighbours. Then BFS level by level from the begin word."
        ]
      }
    ],
    template: `from collections import deque

def grid_bfs(grid, starts):
    rows, cols = len(grid), len(grid[0])
    seen = set(starts)
    queue = deque(starts)
    steps = 0
    while queue:
        for _ in range(len(queue)):            # one BFS level
            r, c = queue.popleft()
            # process (r, c) here; return steps if it is the target
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if (0 <= nr < rows and 0 <= nc < cols
                        and (nr, nc) not in seen and grid[nr][nc] != "#"):
                    seen.add((nr, nc))         # mark when pushing
                    queue.append((nr, nc))
        steps += 1
    return len(seen)

print(grid_bfs([list("..#"), list("..."), list("#..")], [(0, 0)]))`,
    example: {
      name: "Number of Islands",
      n: 102,
      steps: [
        "Grid of '1' (land) and '0' (water). Count islands, where an island is land connected up/down/left/right.",
        "Signal: grid + 'connected' -> each cell is a node, count connected components.",
        "Plan: scan every cell. When you find a '1' that has not been visited, it starts a new island: add 1 to the count, then BFS from it and mark every reachable land cell as visited (set it to '0') so it is not counted again.",
        "Mark a cell when it is pushed to the queue, not when it is popped, so no cell is queued twice.",
        "Dry run on rows '110', '010', '001': (0,0) is '1' -> count 1, BFS sinks (0,0), (0,1), (1,1).",
        "(0,1), (1,1) are now '0', skip. (2,2) is '1' -> count 2, BFS sinks just itself.",
        "Answer 2. Time O(rows * cols), each cell is pushed at most once."
      ],
      code: `from collections import deque

def num_islands(grid):
    rows, cols = len(grid), len(grid[0])
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "1":
                continue
            count += 1
            grid[r][c] = "0"
            queue = deque([(r, c)])
            while queue:
                cr, cc = queue.popleft()
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nr, nc = cr + dr, cc + dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1":
                        grid[nr][nc] = "0"
                        queue.append((nr, nc))
    return count

print(num_islands([list("110"), list("010"), list("001")]))
print(num_islands([list("11000"), list("11000"), list("00100"), list("00011")]))`
    },
    mistakes: [
      "Marking a node as visited when it is popped instead of when it is pushed, so the same cell enters the queue many times and BFS becomes very slow.",
      "Using `list.pop(0)` as a queue; it is O(n). Use `collections.deque` and `popleft()`.",
      "Forgetting the bounds check, or writing `0 <= nr <= rows` (off by one).",
      "Adding an undirected edge in only one direction.",
      "In multi-source BFS, starting from one source at a time instead of pushing all sources before the loop.",
      "Deep recursive DFS on a big grid can hit Python's recursion limit (about 1000). Use BFS or an explicit stack if the grid can be large."
    ],
    practice: [103, 113, 102, 104, 105, 106, 107, 108, 109, 110, 116, 114],
    quiz: [
      {
        q: "A problem asks for the minimum number of moves in a maze where each move costs 1. Which traversal guarantees the shortest answer?",
        options: ["DFS", "BFS", "Either, they always give the same answer"],
        answer: 1,
        why: "BFS explores in order of distance, so the first time it reaches the target is via a shortest path. DFS can find a long path first."
      },
      {
        q: "In Kahn's algorithm, how do you know the course graph has a cycle?",
        options: ["The queue becomes empty", "Some node has indegree 0", "The final order has fewer than n nodes", "A node is visited twice"],
        answer: 2,
        why: "Nodes in a cycle never reach indegree 0, so they never enter the order."
      },
      {
        q: "In Rotting Oranges, why push every rotten orange into the queue before starting BFS?",
        options: ["To save memory", "Because all rotten oranges spread at the same time, so they all belong to minute 0", "Python's deque requires it"],
        answer: 1,
        why: "This is multi-source BFS: all sources form level 0, and each later level is one minute."
      }
    ]
  },

  // ------------------------------------------------------------------ 20
  {
    id: "dsu-dijkstra",
    track: "Patterns",
    order: 20,
    week: 8,
    title: "Union-find and Dijkstra",
    minutes: 55,
    goal: "After this lesson you can write a union-find (DSU) class to track connected groups and detect cycles, and run Dijkstra's algorithm for shortest paths with weighted edges.",
    why: "Union-find gives short, fast answers to connectivity questions, and Dijkstra is the standard answer whenever edges have different weights. Both are expected knowledge for backend and SDE interviews.",
    sections: [
      {
        h: "Union-find in a few lines",
        p: [
          "Union-find (also called DSU, disjoint set union) keeps items in groups. Each group has one representative, called its root. `parent[x]` points towards the root.",
          "`find(x)` follows parent links up to the root. Path compression (`parent[x] = parent[parent[x]]`) flattens the chain as you go, so later finds are almost O(1).",
          "`union(a, b)` finds both roots. If they are the same, a and b were already connected, so return False. Otherwise attach the smaller group under the bigger one and return True."
        ],
        code: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        return True

dsu = DSU(5)
print(dsu.union(0, 1), dsu.union(1, 2), dsu.union(0, 2))
print(dsu.find(2) == dsu.find(0), dsu.find(3) == dsu.find(0))`,
        out: "True True False\nTrue False"
      },
      {
        h: "How to recognise it",
        p: [
          "Union-find: 'number of connected components', 'groups', 'provinces', 'friends of friends', 'are x and y connected', especially when edges arrive one at a time.",
          "Union-find: 'which edge creates a cycle' or 'remove one edge to make a tree' (Redundant Connection 112).",
          "Dijkstra: 'shortest / cheapest / fastest' path where edges have different non-negative weights (times, costs, distances).",
          "If all edges have the same weight, plain BFS is enough. If weights can be negative, Dijkstra is wrong (that needs Bellman-Ford, rare in interviews)."
        ]
      },
      {
        h: "Cycle detection: Redundant Connection",
        p: [
          "Add edges one by one. If both ends already have the same root, this edge closes a cycle. The first such edge is the answer to Redundant Connection (112).",
          "Number of Provinces (111) is the same DSU: start with n groups, subtract 1 every time `union` returns True."
        ],
        code: `def find_redundant_connection(edges):
    parent = list(range(len(edges) + 1))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra == rb:
            return [a, b]
        parent[ra] = rb
    return []

print(find_redundant_connection([[1, 2], [1, 3], [2, 3]]))
print(find_redundant_connection([[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]))`,
        out: "[2, 3]\n[1, 4]"
      },
      {
        h: "Dijkstra: BFS with a heap",
        p: [
          "Dijkstra always expands the node with the smallest known distance next. A min-heap of `(distance, node)` gives that node in O(log n).",
          "When you pop `(d, u)`, the entry may be stale (you found a shorter path to u later). Skip it with `if d > dist[u]: continue`.",
          "For each edge u -> v with weight w, if `d + w` beats the best known distance to v, update it and push the new pair. Total cost is O(E log V)."
        ],
        code: `import heapq

def dijkstra(graph, start):
    dist = {start: 0}
    heap = [(0, start)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist.get(u, float("inf")):
            continue
        for v, w in graph[u]:
            nd = d + w
            if nd < dist.get(v, float("inf")):
                dist[v] = nd
                heapq.heappush(heap, (nd, v))
    return dist

graph = {"A": [("B", 4), ("C", 1)], "B": [("D", 1)], "C": [("B", 2), ("D", 5)], "D": []}
print(dijkstra(graph, "A"))`,
        out: "{'A': 0, 'B': 3, 'C': 1, 'D': 4}"
      },
      {
        h: "Choosing between BFS, DSU and Dijkstra",
        p: [
          "Need fewest steps and every step costs the same: BFS.",
          "Need only 'connected or not' and group counts, especially with edges added over time: DSU.",
          "Need cheapest total cost with different weights: Dijkstra.",
          "Find if Path Exists (113) can be solved by BFS or DSU; try both to feel the difference."
        ]
      }
    ],
    template: `import heapq

class DSU:
    def __init__(self, n):
        self.parent = list(range(n))

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # path compression
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False          # already connected (cycle if this is a new edge)
        self.parent[ra] = rb
        return True

def dijkstra(adj, src, n):
    dist = [float("inf")] * n
    dist[src] = 0
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue              # stale entry
        for v, w in adj[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(heap, (dist[v], v))
    return dist

dsu = DSU(3)
print(dsu.union(0, 1), dsu.union(1, 0))
print(dijkstra([[(1, 2), (2, 5)], [(2, 1)], []], 0, 3))`,
    example: {
      name: "Network Delay Time",
      n: 115,
      steps: [
        "A signal starts at node k. `times[i] = [u, v, w]` means it takes w time to go from u to v. Return the time until all n nodes have it, or -1 if some never do.",
        "Signals: weighted directed edges + 'minimum time' -> Dijkstra from k. The answer is the largest shortest distance.",
        "Build `graph[u] = [(v, w), ...]`. Keep `dist[u]`, push `(0, k)`.",
        "Pop the smallest `(d, u)`. Skip if stale. Relax every edge out of u.",
        "Dry run: times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2. Pop (0, 2): dist[1] = 1, dist[3] = 1.",
        "Pop (1, 1): no outgoing edges. Pop (1, 3): dist[4] = 2. Pop (2, 4): nothing new.",
        "All 4 nodes reached, max distance = 2.",
        "If some node never gets a finite distance (second demo), return -1."
      ],
      code: `import heapq
from collections import defaultdict

def network_delay_time(times, n, k):
    graph = defaultdict(list)
    for u, v, w in times:
        graph[u].append((v, w))
    dist = [float("inf")] * (n + 1)
    dist[k] = 0
    heap = [(0, k)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(heap, (dist[v], v))
    best = max(dist[1:])
    return best if best != float("inf") else -1

print(network_delay_time([[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2))
print(network_delay_time([[1, 2, 1]], 2, 2))`
    },
    mistakes: [
      "Writing `find` without path compression and getting TLE on large inputs.",
      "Comparing `parent[a] == parent[b]` instead of `find(a) == find(b)`; only roots tell you the group.",
      "Unioning a and b directly (`parent[a] = b`) instead of their roots, which breaks the groups.",
      "Forgetting the stale-entry check in Dijkstra, which makes it much slower on dense graphs.",
      "Using Dijkstra when every edge has weight 1 (BFS is simpler), or when weights can be negative (Dijkstra gives wrong answers).",
      "Off-by-one with 1-indexed nodes: allocate `n + 1` slots and ignore index 0."
    ],
    practice: [111, 112, 115],
    quiz: [
      {
        q: "While adding edges to a DSU, `union(a, b)` returns False. What does that mean?",
        options: ["a or b does not exist", "a and b were already connected, so this edge forms a cycle", "The union failed due to group sizes"],
        answer: 1,
        why: "Both have the same root, so a path between them already exists. Adding the edge closes a cycle."
      },
      {
        q: "When is plain BFS enough instead of Dijkstra?",
        options: ["When the graph is directed", "When every edge has the same weight", "When there are fewer than 100 nodes"],
        answer: 1,
        why: "With equal weights, fewest edges equals lowest cost, and BFS finds fewest edges."
      },
      {
        q: "In Dijkstra you pop (7, u) but dist[u] is already 5. What should you do?",
        options: ["Update dist[u] to 7", "Skip it, it is a stale entry", "Stop the algorithm"],
        answer: 1,
        why: "A shorter path to u was already processed. This old heap entry is outdated."
      }
    ]
  },

  // ------------------------------------------------------------------ 21
  {
    id: "dp-1d",
    track: "Patterns",
    order: 21,
    week: 9,
    title: "Dynamic programming 1: from recursion to memo to table",
    minutes: 75,
    goal: "After this lesson you can turn a brute-force recursion into a memoized solution and then a bottom-up table, and solve the common 1-D DP shapes (stairs, take/skip, min coins, prefix splits).",
    why: "DP is the topic most beginners fear and many OAs include at least one DP question. A fixed 3-step method (recurse, memo, table) makes it mechanical.",
    sections: [
      {
        h: "Step 1: write the plain recursion",
        p: [
          "Define a state in words first. Climbing Stairs (117): `climb(n)` = number of ways to reach step n taking 1 or 2 steps.",
          "Write the choices: the last move was either 1 step or 2 steps, so `climb(n) = climb(n - 1) + climb(n - 2)`. Write base cases: `climb(0) = climb(1) = 1`.",
          "This is correct but slow. The same subproblems are solved again and again; the call count grows exponentially."
        ],
        code: `calls = 0

def climb(n):
    global calls
    calls += 1
    if n <= 1:
        return 1
    return climb(n - 1) + climb(n - 2)

print(climb(10), calls)`,
        out: "89 177"
      },
      {
        h: "Step 2: memoize with @cache",
        p: [
          "If a function's result depends only on its arguments, save results so each state is computed once. In Python, put `@cache` from `functools` above the function.",
          "Now each n is computed once, so the cost is O(n) states times O(1) work each. `climb(50)` finishes instantly.",
          "This top-down version is often the fastest way to a correct answer in an interview. Arguments must be hashable (ints, strings, tuples, not lists)."
        ],
        code: `from functools import cache

@cache
def climb(n):
    if n <= 1:
        return 1
    return climb(n - 1) + climb(n - 2)

print(climb(10), climb(50))`,
        out: "89 20365011074"
      },
      {
        h: "Step 3: bottom-up table, then two variables",
        p: [
          "Replace recursion with a list `dp` where `dp[i]` holds the answer for state i. Fill it from the base cases upwards, in the order the recursion needs.",
          "If `dp[i]` only looks at the previous one or two entries, keep just two variables. That cuts memory from O(n) to O(1).",
          "Bottom-up also avoids Python's recursion limit for large n."
        ],
        code: `def climb_table(n):
    dp = [0] * (n + 1)
    dp[0] = 1
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]

def climb_vars(n):
    a, b = 1, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b

print(climb_table(5), climb_vars(5), climb_vars(10))`,
        out: "8 8 89"
      },
      {
        h: "How to recognise it",
        p: [
          "The question asks for a COUNT of ways, a MIN or MAX value, or a yes/no 'is it possible', not for listing every answer.",
          "Choices at each step: take or skip, 1 step or 2 steps, which coin, where to cut the string.",
          "The brute-force recursion calls itself with the same arguments many times (overlapping subproblems).",
          "Phrases like 'minimum number of coins', 'maximum amount you can rob', 'number of ways to decode', 'can the string be segmented'.",
          "Constraints like n up to 1000 or 10000 with a sequence input often mean O(n) or O(n^2) DP."
        ]
      },
      {
        h: "Common 1-D shapes",
        p: [
          "Take / skip: House Robber (119): `dp[i] = max(dp[i - 1], dp[i - 2] + nums[i])`. House Robber II (120) runs it twice, on `nums[1:]` and `nums[:-1]`, because first and last houses touch.",
          "Min over choices: Min Cost Climbing Stairs (118) and Coin Change (121): `dp[a] = min(dp[a - c] + 1 for each coin c)`. Start with infinity so 'impossible' stays visible.",
          "Track both max and min: Maximum Product Subarray (125), because a negative number turns the smallest product into the largest.",
          "Count ways with 1- or 2-character steps: Decode Ways (124); a '0' cannot stand alone.",
          "Reachable set: Partition Equal Subset Sum (126) keeps a set of sums you can make; check if `total // 2` is in it."
        ],
        code: `def coin_change(coins, amount):
    INF = float("inf")
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return dp[amount] if dp[amount] != INF else -1

print(coin_change([1, 2, 5], 11), coin_change([2], 3))`,
        out: "3 -1"
      },
      {
        h: "DP over prefixes: Word Break and LIS",
        p: [
          "Word Break (123): `dp[i]` is True if `s[:i]` can be split into dictionary words. `dp[i]` is True if some `j < i` has `dp[j]` True and `s[j:i]` is a word. Put the words in a `set` first.",
          "Longest Increasing Subsequence (122): `dp[i]` = length of the longest increasing subsequence ending at index i = 1 + max of `dp[j]` for `j < i` with `nums[j] < nums[i]`. That is O(n^2); the faster O(n log n) version keeps a `tails` list and uses `bisect_left`."
        ],
        code: `def word_break(s, word_dict):
    words = set(word_dict)
    dp = [False] * (len(s) + 1)
    dp[0] = True
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in words:
                dp[i] = True
                break
    return dp[len(s)]

def length_of_lis(nums):
    dp = [1] * len(nums)
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp)

print(word_break("leetcode", ["leet", "code"]))
print(word_break("catsandog", ["cats", "dog", "sand", "and", "cat"]))
print(length_of_lis([10, 9, 2, 5, 3, 7, 101, 18]))`,
        out: "True\nFalse\n4"
      }
    ],
    template: `from functools import cache

def solve_top_down(nums):
    @cache
    def dp(i):                      # 1. state in words: best answer from index i onward
        if i >= len(nums):          # 2. base case
            return 0
        take = nums[i] + dp(i + 2)  # 3. choices
        skip = dp(i + 1)
        return max(take, skip)      # 4. combine
    return dp(0)

def solve_bottom_up(nums):
    n = len(nums)
    dp = [0] * (n + 2)              # same state, filled from the base case upwards
    for i in range(n - 1, -1, -1):
        dp[i] = max(nums[i] + dp[i + 2], dp[i + 1])
    return dp[0]

print(solve_top_down([2, 7, 9, 3, 1]), solve_bottom_up([2, 7, 9, 3, 1]))`,
    example: {
      name: "House Robber",
      n: 119,
      steps: [
        "Houses in a row with money `nums[i]`. You cannot rob two adjacent houses. Maximise the total.",
        "Signals: 'maximum' + a choice at each house (rob or skip) + adjacent conflict -> 1-D DP, take/skip shape.",
        "State: `best(i)` = max money from the first i houses. For house i: skip it -> `best(i - 1)`; rob it -> `best(i - 2) + nums[i]`. Take the max.",
        "Only the last two values are needed, so keep `prev2` (best up to i - 2) and `prev1` (best up to i - 1).",
        "Dry run on [2, 7, 9, 3, 1], starting with (prev2, prev1) = (0, 0):",
        "x = 2 -> (0, max(0, 0 + 2)) = (0, 2). x = 7 -> (2, max(2, 0 + 7)) = (2, 7).",
        "x = 9 -> (7, max(7, 2 + 9)) = (7, 11). x = 3 -> (11, max(11, 7 + 3)) = (11, 11).",
        "x = 1 -> (11, max(11, 11 + 1)) = (11, 12). Answer 12 (houses 2 + 9 + 1).",
        "Time O(n), space O(1)."
      ],
      code: `def rob(nums):
    prev2, prev1 = 0, 0
    for x in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + x)
    return prev1

print(rob([2, 7, 9, 3, 1]))
print(rob([1, 2, 3, 1]))`
    },
    mistakes: [
      "Jumping straight to a table without first writing the recursion in words. Define the state and the choices before coding.",
      "Wrong or missing base cases, for example `dp[0] = 0` in Coin Change but forgetting that other amounts start at infinity.",
      "Filling the table in the wrong order, so `dp[i]` reads a value that has not been computed yet.",
      "Using `@cache` on a function that takes a list argument; lists are not hashable. Pass an index instead.",
      "Updating two rolling variables in two separate lines, which overwrites a value you still need. Use tuple assignment `a, b = b, a + b`.",
      "Returning `float('inf')` instead of -1 when the answer is impossible."
    ],
    practice: [117, 118, 119, 120, 121, 124, 123, 125, 122, 126],
    quiz: [
      {
        q: "Which sign tells you a recursive solution will benefit from memoization?",
        options: ["The recursion has a base case", "The same arguments are computed many times", "The input is sorted", "The function returns a list"],
        answer: 1,
        why: "Memoization helps only when subproblems overlap. Caching makes each distinct state run once."
      },
      {
        q: "In Coin Change, why initialise `dp` with infinity except `dp[0] = 0`?",
        options: ["So min() can tell 'unreachable' amounts apart from real counts", "Because Python lists must start with infinity", "To make the loop faster"],
        answer: 0,
        why: "Infinity means 'cannot make this amount yet'. Any real count will be smaller and replace it."
      },
      {
        q: "House Robber with rolling variables: what does `prev1` hold after processing [2, 7, 9]?",
        options: ["9", "11", "18", "7"],
        answer: 1,
        why: "Best is 2 + 9 = 11, since 7 and 9 are adjacent and 7 alone is smaller."
      }
    ]
  },

  // ------------------------------------------------------------------ 22
  {
    id: "dp-2d",
    track: "Patterns",
    order: 22,
    week: 10,
    title: "Dynamic programming 2: grids and two strings",
    minutes: 75,
    goal: "After this lesson you can set up 2-D DP tables for grid paths and for comparing two strings, and handle knapsack counting, palindromes and state-machine DP.",
    why: "LCS and Edit Distance are classic interview questions and grid DP shows up in many OAs. They all follow one table-filling recipe.",
    sections: [
      {
        h: "Grid DP: each cell from its neighbours",
        p: [
          "Unique Paths (129): you can only move right or down, so the number of ways to reach a cell is the ways from above plus the ways from the left.",
          "First row and first column have exactly 1 way each. Fill the rest row by row.",
          "Each row only needs the row above, so a single 1-D list works: `row[c] += row[c - 1]` (the old `row[c]` is 'from above', `row[c - 1]` is 'from the left'). Minimum Path Sum (135) is the same idea with `min` and costs."
        ],
        code: `def unique_paths(m, n):
    row = [1] * n
    for _ in range(1, m):
        for c in range(1, n):
            row[c] += row[c - 1]
    return row[-1]

print(unique_paths(3, 7), unique_paths(3, 2))`,
        out: "28 3"
      },
      {
        h: "Two strings: dp[i][j] on prefixes",
        p: [
          "When comparing strings a and b, let `dp[i][j]` be the answer for the first i characters of a and the first j characters of b. The table is `(len(a) + 1) x (len(b) + 1)`; row 0 and column 0 mean 'empty prefix'.",
          "Look at the last characters `a[i - 1]` and `b[j - 1]`. If they match, usually use `dp[i - 1][j - 1]`. If not, combine the neighbours `dp[i - 1][j]`, `dp[i][j - 1]`, `dp[i - 1][j - 1]`.",
          "Edit Distance (133): base cases are `dp[i][0] = i` (delete everything) and `dp[0][j] = j` (insert everything). On mismatch it is 1 + min of delete, insert, replace."
        ],
        code: `def min_distance(word1, word2):
    n, m = len(word1), len(word2)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = i
    for j in range(m + 1):
        dp[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if word1[i - 1] == word2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    return dp[n][m]

print(min_distance("horse", "ros"), min_distance("intention", "execution"))`,
        out: "3 5"
      },
      {
        h: "How to recognise it",
        p: [
          "A grid where you move only right/down and want a count, min cost or max value.",
          "Two strings or two arrays and the words 'common subsequence', 'edit', 'convert', 'match', 'interleave'.",
          "A 1-D DP whose state needs a second number: index plus remaining amount, index plus 'am I holding a stock'.",
          "'Number of ways to make amount' with coins (Coin Change II 131), or 'assign + or - to reach target' (Target Sum 132).",
          "Palindromic substrings: often solved more simply by expanding around each center than by a table."
        ]
      },
      {
        h: "Knapsack counting: Coin Change II and Target Sum",
        p: [
          "Coin Change II (131) counts combinations, not orderings. Put coins in the OUTER loop and amounts in the inner loop; each coin is then considered once, in a fixed order, so 1+2 and 2+1 are not counted twice.",
          "Target Sum (132) becomes subset sum: if P is the plus group, `P = (total + target) / 2`. Count subsets that sum to P with the same 1-D counting array (iterate amounts backwards because each number is used once). Or use `@cache` on `(i, current_sum)`."
        ],
        code: `def change(amount, coins):
    dp = [1] + [0] * amount
    for c in coins:
        for a in range(c, amount + 1):
            dp[a] += dp[a - c]
    return dp[amount]

def find_target_sum_ways(nums, target):
    total = sum(nums)
    if abs(target) > total or (total + target) % 2:
        return 0
    p = (total + target) // 2
    dp = [1] + [0] * p
    for x in nums:
        for a in range(p, x - 1, -1):
            dp[a] += dp[a - x]
    return dp[p]

print(change(5, [1, 2, 5]), find_target_sum_ways([1, 1, 1, 1, 1], 3))`,
        out: "4 5"
      },
      {
        h: "Palindromes: expand around center",
        p: [
          "Longest Palindromic Substring (127) and Palindromic Substrings (128) can use a 2-D table, but expanding is simpler and uses O(1) memory.",
          "Every palindrome has a center: a single character (odd length) or a gap between two characters (even length). That is `2n - 1` centers. From each, expand while the ends match.",
          "For 128, add 1 to a counter on every successful expansion instead of tracking the longest."
        ],
        code: `def longest_palindrome(s):
    best = ""
    for center in range(2 * len(s) - 1):
        l = center // 2
        r = l + center % 2
        while l >= 0 and r < len(s) and s[l] == s[r]:
            l -= 1
            r += 1
        if r - l - 1 > len(best):
            best = s[l + 1:r]
    return best

print(longest_palindrome("babad"), longest_palindrome("cbbd"))`,
        out: "bab bb"
      },
      {
        h: "State-machine DP: stock with cooldown",
        p: [
          "In Best Time to Buy and Sell Stock with Cooldown (134), on each day you are in one of three states: `hold` (own a stock), `sold` (just sold today), `rest` (no stock, free to buy).",
          "Transitions: `hold = max(hold, rest - price)`, `sold = hold + price`, `rest = max(rest, sold)`. Update all three together using the previous day's values."
        ],
        code: `def max_profit(prices):
    hold, sold, rest = float("-inf"), 0, 0
    for p in prices:
        hold, sold, rest = max(hold, rest - p), hold + p, max(rest, sold)
    return max(sold, rest)

print(max_profit([1, 2, 3, 0, 2]))`,
        out: "3"
      }
    ],
    template: `def two_string_dp(a, b):
    n, m = len(a), len(b)
    dp = [[0] * (m + 1) for _ in range(n + 1)]   # dp[i][j]: answer for a[:i], b[:j]
    # base cases: fill dp[i][0] and dp[0][j] here if they are not 0
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[n][m]

print(two_string_dp("abcde", "ace"))`,
    example: {
      name: "Longest Common Subsequence",
      n: 130,
      steps: [
        "Given text1 and text2, return the length of their longest common subsequence (characters in order, not necessarily next to each other).",
        "Signals: two strings + 'subsequence' -> 2-D DP on prefixes.",
        "State: `dp[i][j]` = LCS length of `text1[:i]` and `text2[:j]`. Row 0 and column 0 are 0 (empty string has no common subsequence).",
        "If `text1[i - 1] == text2[j - 1]`, that character extends the LCS of both shorter prefixes: `dp[i - 1][j - 1] + 1`. Otherwise drop one character from either string: `max(dp[i - 1][j], dp[i][j - 1])`.",
        "Dry run with 'abcde' and 'ace'. Row 'a': a matches a -> [1, 1, 1]. Row 'b': no match -> [1, 1, 1].",
        "Row 'c': c matches c -> dp = dp[a-row before c] + 1 = 2 -> [1, 2, 2]. Row 'd': [1, 2, 2].",
        "Row 'e': e matches e -> 2 + 1 = 3 -> [1, 2, 3]. Answer dp[5][3] = 3 ('ace').",
        "Time and space O(n * m)."
      ],
      code: `def longest_common_subsequence(text1, text2):
    n, m = len(text1), len(text2)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if text1[i - 1] == text2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[n][m]

print(longest_common_subsequence("abcde", "ace"))
print(longest_common_subsequence("abc", "def"))`
    },
    mistakes: [
      "Creating the table with `[[0] * (m + 1)] * (n + 1)`; every row is the same list object, so writing one row changes all of them.",
      "Mixing up indices: `dp[i][j]` describes prefixes of length i and j, so the characters are `a[i - 1]` and `b[j - 1]`.",
      "Forgetting base cases that are not zero, like `dp[i][0] = i` in Edit Distance.",
      "In Coin Change II, putting amounts in the outer loop, which counts orderings (permutations) instead of combinations.",
      "In 0/1 knapsack with a 1-D array, looping amounts forwards, which lets one item be used many times. Loop backwards.",
      "For palindromes, checking only odd-length centers and missing answers like 'bb'."
    ],
    practice: [129, 135, 130, 127, 128, 131, 132, 133, 134],
    quiz: [
      {
        q: "In LCS, the current characters match. What is dp[i][j]?",
        options: ["max(dp[i-1][j], dp[i][j-1])", "dp[i-1][j-1] + 1", "dp[i-1][j] + 1", "1"],
        answer: 1,
        why: "The matching character extends the best common subsequence of the two shorter prefixes."
      },
      {
        q: "Why is `[[0] * m] * n` a bug for a DP table?",
        options: ["It creates n references to the same row", "It creates a tuple, not a list", "It is too slow"],
        answer: 0,
        why: "List multiplication copies the reference, so all rows share memory. Use a list comprehension."
      },
      {
        q: "Coin Change II counts combinations. Which loop order is correct?",
        options: ["Amounts outer, coins inner", "Coins outer, amounts inner", "Either order gives the same count"],
        answer: 1,
        why: "Coins outer means each combination is built in one fixed coin order, so 1+2 and 2+1 count once."
      }
    ]
  },

  // ------------------------------------------------------------------ 23
  {
    id: "greedy-intervals",
    track: "Patterns",
    order: 23,
    week: 10,
    title: "Greedy and intervals",
    minutes: 60,
    goal: "After this lesson you can spot problems where a single local rule gives the optimal answer, and solve interval problems by sorting and sweeping.",
    why: "Greedy and interval problems (merge intervals, meeting rooms, jump game) appear very often in OAs because the code is short but the idea must be right.",
    sections: [
      {
        h: "What greedy means",
        p: [
          "A greedy algorithm makes the best-looking choice at each step and never goes back. It is correct only when you can argue that the local choice never hurts the final answer.",
          "Jump Game (136): track `reach`, the farthest index you can get to so far. If you ever stand at an index beyond `reach`, you are stuck. One pass, O(n), no DP needed.",
          "Jump Game II (137) uses the same idea in levels: `end` is the edge of the current jump, `farthest` is the best next edge; when `i == end`, take a jump."
        ],
        code: `def can_jump(nums):
    reach = 0
    for i, x in enumerate(nums):
        if i > reach:
            return False
        reach = max(reach, i + x)
    return True

print(can_jump([2, 3, 1, 1, 4]), can_jump([3, 2, 1, 0, 4]))`,
        out: "True False"
      },
      {
        h: "How to recognise it",
        p: [
          "The input is a list of intervals `[start, end]`: meetings, balloons, ranges. Sort first, almost always.",
          "Words like 'merge overlapping', 'minimum number to remove so none overlap', 'minimum arrows', 'intersection of two lists'.",
          "'Can you reach the end', 'minimum jumps', 'can you complete the circuit': a running maximum or running sum often works.",
          "A brute force would try all orders, but sorting by one key (end time, start time, value) makes one obvious choice best.",
          "If a greedy rule fails on a small counter-example you can construct, switch to DP."
        ]
      },
      {
        h: "Greedy with a running state",
        p: [
          "Gas Station (138): if total gas is less than total cost, the answer is -1. Otherwise, walk once with a `tank`; whenever it drops below 0, the start must be after this index, so reset `tank = 0` and `start = i + 1`.",
          "Partition Labels (140): record the last index of each letter. Walk the string and stretch `end` to the last index of every letter seen. When `i == end`, the current part is closed.",
          "Valid Parenthesis String (141): track the range `[lo, hi]` of possible open counts; clamp `lo` at 0 and fail if `hi` goes below 0.",
          "Hand of Straights (139): count cards, then always start a run from the smallest remaining card."
        ],
        code: `def partition_labels(s):
    last = {c: i for i, c in enumerate(s)}
    res = []
    start = end = 0
    for i, c in enumerate(s):
        end = max(end, last[c])
        if i == end:
            res.append(end - start + 1)
            start = i + 1
    return res

def can_complete_circuit(gas, cost):
    if sum(gas) < sum(cost):
        return -1
    tank, start = 0, 0
    for i in range(len(gas)):
        tank += gas[i] - cost[i]
        if tank < 0:
            tank, start = 0, i + 1
    return start

print(partition_labels("ababcbacadefegdehijhklij"))
print(can_complete_circuit([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]))`,
        out: "[9, 7, 8]\n3"
      },
      {
        h: "Intervals: sort by end to keep the most",
        p: [
          "Two intervals [a, b] and [c, d] overlap when `c < b` and `a < d` (use `<=` if touching counts as overlap; read the problem).",
          "To keep as many non-overlapping intervals as possible, sort by END and always keep the interval that finishes first. It leaves the most room for the rest.",
          "Non-overlapping Intervals (144) returns how many you had to drop. Minimum Arrows (145) is the same: a new arrow is needed when a balloon starts after the current arrow position (the previous end)."
        ],
        code: `def erase_overlap_intervals(intervals):
    intervals.sort(key=lambda x: x[1])
    removed = 0
    prev_end = float("-inf")
    for start, end in intervals:
        if start >= prev_end:
            prev_end = end
        else:
            removed += 1
    return removed

def find_min_arrow_shots(points):
    points.sort(key=lambda x: x[1])
    arrows = 0
    arrow_at = float("-inf")
    for start, end in points:
        if start > arrow_at:
            arrows += 1
            arrow_at = end
    return arrows

print(erase_overlap_intervals([[1, 2], [2, 3], [3, 4], [1, 3]]))
print(find_min_arrow_shots([[10, 16], [2, 8], [1, 6], [7, 12]]))`,
        out: "1\n2"
      },
      {
        h: "Two lists of intervals: two pointers",
        p: [
          "Interval List Intersections (146): both lists are sorted. The overlap of two intervals is `[max(starts), min(ends)]` if that is a valid range.",
          "After comparing, move the pointer whose interval ends first; it cannot overlap anything further in the other list.",
          "Insert Interval (143) is a three-phase sweep: copy intervals that end before the new one, merge all that overlap it, then copy the rest."
        ],
        code: `def interval_intersection(a, b):
    i = j = 0
    res = []
    while i < len(a) and j < len(b):
        lo = max(a[i][0], b[j][0])
        hi = min(a[i][1], b[j][1])
        if lo <= hi:
            res.append([lo, hi])
        if a[i][1] < b[j][1]:
            i += 1
        else:
            j += 1
    return res

print(interval_intersection([[0, 2], [5, 10], [13, 23], [24, 25]],
                            [[1, 5], [8, 12], [15, 24], [25, 26]]))`,
        out: "[[1, 2], [5, 5], [8, 10], [15, 23], [24, 24], [25, 25]]"
      }
    ],
    template: `def sweep_intervals(intervals):
    intervals.sort(key=lambda x: x[0])     # or x[1] for 'keep the most'
    result = []
    for start, end in intervals:
        if result and start <= result[-1][1]:   # overlaps the last kept one
            result[-1][1] = max(result[-1][1], end)
        else:
            result.append([start, end])
    return result

print(sweep_intervals([[5, 6], [1, 3], [2, 4]]))`,
    example: {
      name: "Merge Intervals",
      n: 142,
      steps: [
        "Given a list of intervals, merge all overlapping ones and return the result.",
        "Signals: list of `[start, end]` + 'merge overlapping' -> sort by start, then one sweep.",
        "After sorting by start, an interval can only overlap the LAST merged interval, never an earlier one. So keep a `merged` list and compare with `merged[-1]`.",
        "If `start <= merged[-1][1]` they overlap: extend the end with `max` (the new one may be fully inside). Otherwise append a new interval.",
        "Dry run on [[1, 3], [8, 10], [2, 6], [15, 18]]. Sorted: [[1, 3], [2, 6], [8, 10], [15, 18]].",
        "[1, 3] -> merged = [[1, 3]]. [2, 6]: 2 <= 3 -> end = max(3, 6) = 6 -> [[1, 6]].",
        "[8, 10]: 8 > 6 -> append. [15, 18]: 15 > 10 -> append. Result [[1, 6], [8, 10], [15, 18]].",
        "Time O(n log n) for the sort, O(n) for the sweep."
      ],
      code: `def merge(intervals):
    intervals.sort(key=lambda x: x[0])
    merged = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged

print(merge([[1, 3], [8, 10], [2, 6], [15, 18]]))
print(merge([[1, 4], [4, 5]]))
print(merge([[1, 10], [2, 3]]))`
    },
    mistakes: [
      "Forgetting to sort intervals first. Every sweep assumes sorted input.",
      "Setting the merged end to the new end instead of `max(old_end, new_end)`, which breaks when one interval is inside another.",
      "Sorting by start when the problem needs 'keep the most intervals' (sort by end) and vice versa.",
      "Getting `<` vs `<=` wrong for touching intervals like [1, 2] and [2, 3]; read whether touching counts as overlap.",
      "Trusting a greedy rule without testing it on a small tricky case; if it fails, the problem probably needs DP.",
      "In Jump Game, checking `reach >= len(nums) - 1` only at the end but not stopping when `i > reach`."
    ],
    practice: [136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146],
    quiz: [
      {
        q: "To keep the maximum number of non-overlapping intervals, which sort order makes greedy correct?",
        options: ["By start time", "By end time", "By length", "By start time descending"],
        answer: 1,
        why: "Keeping the interval that ends earliest leaves the most room for the remaining intervals."
      },
      {
        q: "After sorting by start, merging [1, 10] and then [2, 3] should give ...",
        options: ["[1, 3]", "[1, 10]", "[[1, 10], [2, 3]]"],
        answer: 1,
        why: "[2, 3] is inside [1, 10]; the end must be max(10, 3) = 10."
      },
      {
        q: "In Jump Game, when should you return False?",
        options: ["When nums[i] == 0", "When the current index i is greater than the farthest reach so far", "When reach is less than len(nums)"],
        answer: 1,
        why: "A zero is fine if you can jump over it. You are stuck only when you cannot even reach index i."
      }
    ]
  },

  // ------------------------------------------------------------------ 24
  {
    id: "bits-matrix",
    track: "Patterns",
    order: 24,
    week: 11,
    title: "Bit manipulation and matrix tricks",
    minutes: 40,
    goal: "After this lesson you can use XOR, AND and shifts for classic bit questions, and rotate or spiral-walk a matrix in place using index tricks.",
    why: "These are short questions that appear as warm-ups in interviews and OAs. Knowing the one-line trick saves a lot of time.",
    sections: [
      {
        h: "Bit operators you need",
        p: [
          "`&` (and) keeps bits set in both, `|` (or) keeps bits set in either, `^` (xor) keeps bits set in exactly one. `<<` and `>>` shift left and right; `x << 1` doubles, `x >> 1` halves (floor).",
          "`n & (n - 1)` removes the lowest set bit. `n & -n` keeps only the lowest set bit.",
          "`bin(n)` shows the binary string, handy for debugging."
        ],
        code: `a, b = 6, 3
print(bin(a), bin(b))
print(a & b, a | b, a ^ b)
print(a << 1, a >> 1)
print(a & (a - 1), a & -a)`,
        out: "0b110 0b11\n2 7 5\n12 3\n4 2"
      },
      {
        h: "XOR cancels pairs",
        p: [
          "XOR rules: `x ^ x == 0`, `x ^ 0 == x`, and the order does not matter. So XOR of all numbers cancels every pair and leaves the one without a partner.",
          "Single Number (147) is solved in O(n) time and O(1) memory this way. `functools.reduce(operator.xor, nums)` is the one-liner."
        ],
        code: `from functools import reduce
from operator import xor

def single_number(nums):
    res = 0
    for x in nums:
        res ^= x
    return res

print(single_number([4, 1, 2, 1, 2]), reduce(xor, [2, 2, 1]))`,
        out: "4 1"
      },
      {
        h: "Counting set bits",
        p: [
          "Number of 1 Bits (148): repeat `n &= n - 1` until n is 0. Each step clears exactly one set bit, so the loop runs once per 1 bit.",
          "In Python, `bin(n).count('1')` also works and is fine in interviews if you can explain the bit version too."
        ],
        code: `def hamming_weight(n):
    count = 0
    while n:
        n &= n - 1
        count += 1
    return count

print(hamming_weight(11), hamming_weight(128), bin(11).count("1"))`,
        out: "3 1 3"
      },
      {
        h: "How to recognise it",
        p: [
          "Bits: 'every element appears twice except one', 'without extra space', 'count 1 bits', 'power of two', 'subsets as bitmasks'.",
          "Bits: the problem mentions binary representation or forbids arithmetic operators.",
          "Matrix: 'rotate the image in place', 'spiral order', 'set matrix zeroes', 'transpose'.",
          "Matrix: the trick is almost always index arithmetic (swap `[i][j]` with `[j][i]`, shrink four boundaries), not a new algorithm."
        ]
      },
      {
        h: "Rotate a matrix in place",
        p: [
          "Rotate Image (149): a 90 degree clockwise rotation equals transpose (swap `m[i][j]` and `m[j][i]` above the diagonal) and then reverse each row.",
          "Loop `j` from `i + 1`, not from 0; otherwise each pair is swapped twice and nothing changes.",
          "For counter-clockwise: transpose, then reverse the order of the rows."
        ],
        code: `def rotate(matrix):
    n = len(matrix)
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:
        row.reverse()

m = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
rotate(m)
print(m)`,
        out: "[[7, 4, 1], [8, 5, 2], [9, 6, 3]]"
      }
    ],
    template: `def lowest_bit_tricks(n):
    count = 0
    while n:
        n &= n - 1                # drop lowest set bit
        count += 1
    return count

def is_power_of_two(n):
    return n > 0 and n & (n - 1) == 0

def walk_boundaries(matrix):
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    out = []
    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            out.append(matrix[top][c])
        top += 1
        for r in range(top, bottom + 1):
            out.append(matrix[r][right])
        right -= 1
        if top <= bottom:
            for c in range(right, left - 1, -1):
                out.append(matrix[bottom][c])
            bottom -= 1
        if left <= right:
            for r in range(bottom, top - 1, -1):
                out.append(matrix[r][left])
            left += 1
    return out

print(lowest_bit_tricks(7), is_power_of_two(16), walk_boundaries([[1, 2], [3, 4]]))`,
    example: {
      name: "Spiral Matrix",
      n: 150,
      steps: [
        "Return all elements of an m x n matrix in spiral order (right along the top, down the right side, left along the bottom, up the left side, then repeat inside).",
        "Keep four boundaries: `top`, `bottom`, `left`, `right`. After walking one side, shrink that boundary by 1.",
        "Walk top row left to right, then `top += 1`. Walk right column top to bottom, then `right -= 1`.",
        "Before walking the bottom row, check `top <= bottom`; before walking the left column, check `left <= right`. These checks stop double-counting when only one row or column is left.",
        "Dry run on [[1,2,3],[4,5,6],[7,8,9]]: top row 1 2 3 (top = 1). Right column 6 9 (right = 1). Bottom row 8 7 (bottom = 1). Left column 4 (left = 1).",
        "Second loop: top = bottom = 1, left = right = 1. Top row gives 5, top becomes 2. Right column loop is empty. top > bottom, so skip bottom row; left <= right but its range is empty.",
        "Result [1, 2, 3, 6, 9, 8, 7, 4, 5]. Time O(m * n)."
      ],
      code: `def spiral_order(matrix):
    res = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            res.append(matrix[top][c])
        top += 1
        for r in range(top, bottom + 1):
            res.append(matrix[r][right])
        right -= 1
        if top <= bottom:
            for c in range(right, left - 1, -1):
                res.append(matrix[bottom][c])
            bottom -= 1
        if left <= right:
            for r in range(bottom, top - 1, -1):
                res.append(matrix[r][left])
            left += 1
    return res

print(spiral_order([[1, 2, 3], [4, 5, 6], [7, 8, 9]]))
print(spiral_order([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]))`
    },
    mistakes: [
      "Mixing up `^` (XOR) with power; in Python power is `**`.",
      "Forgetting operator precedence: `n & n - 1 == 0` parses wrongly. Write `(n & (n - 1)) == 0`.",
      "In Rotate Image, looping `j` from 0 during the transpose, which swaps every pair twice and undoes the work.",
      "Building a new matrix when the problem says 'in place'. Use `matrix[:] = ...` or swap inside the original.",
      "In Spiral Matrix, leaving out the `top <= bottom` and `left <= right` checks, so a single middle row or column is printed twice."
    ],
    practice: [147, 148, 149, 150],
    quiz: [
      {
        q: "What does XOR of [5, 3, 5] give?",
        options: ["0", "3", "5", "13"],
        answer: 1,
        why: "5 ^ 5 = 0 and 0 ^ 3 = 3. Paired values cancel out."
      },
      {
        q: "What does `n & (n - 1)` do?",
        options: ["Doubles n", "Clears the lowest set bit of n", "Keeps only the lowest set bit", "Flips all bits"],
        answer: 1,
        why: "Subtracting 1 flips the lowest 1 bit and the zeros below it; AND with n clears that bit."
      },
      {
        q: "Rotating a square matrix 90 degrees clockwise in place equals ...",
        options: ["Reverse each row, then reverse the row order", "Transpose, then reverse each row", "Transpose twice"],
        answer: 1,
        why: "Transpose turns rows into columns; reversing each row then gives the clockwise orientation."
      }
    ]
  }
);
