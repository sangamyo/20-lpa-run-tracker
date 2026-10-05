// Pattern lessons (orders 7-15): arrays/hashing through BSTs.
window.LESSONS = window.LESSONS || [];
window.LESSONS.push(
  {
    id: "arrays-hashing",
    track: "Patterns",
    order: 7,
    week: 1,
    title: "Arrays and hashing: trade memory for speed",
    minutes: 60,
    goal: "After this lesson you can replace a slow nested loop with a set or dict lookup and spot when a problem wants counting, a complement lookup, or a canonical key.",
    why: "Hashing is the most common first step in OA and phone-screen problems. Turning O(n^2) into O(n) with a dict is the single most expected optimisation in interviews.",
    sections: [
      {
        h: "The core idea: O(1) lookup",
        p: [
          "A Python `set` answers 'have I seen x?' in O(1) on average. A `dict` answers 'what do I know about x?' in O(1). A list needs O(n) for the same question because `x in my_list` scans every element.",
          "So the trade is simple: spend O(n) extra memory to store what you have seen, and every later check becomes instant. A brute force with two nested loops (O(n^2)) usually becomes one loop plus a set or dict (O(n)).",
          "Contains Duplicate is the smallest example: walk the list, and before adding each number to `seen`, check if it is already there."
        ],
        code: `nums = [3, 1, 4, 1, 5]
seen = set()
for x in nums:
    if x in seen:
        print("duplicate:", x)
        break
    seen.add(x)

# one-liner version: a set drops duplicates
print(len(set(nums)) != len(nums))`,
        out: "duplicate: 1\nTrue"
      },
      {
        h: "How to recognise it",
        p: [
          "Signal 1: the problem says 'contains duplicate', 'seen before', 'unique', 'distinct'. Think `set`.",
          "Signal 2: 'anagram', 'frequency', 'most common', 'top k frequent', 'majority'. Think counting with a `dict` or `collections.Counter`.",
          "Signal 3: 'find two numbers that add up to target' on an UNSORTED array. Think complement lookup: for each `x`, check if `target - x` is already in a dict.",
          "Signal 4: 'group items that are equivalent' (anagrams, same pattern). Think canonical key: convert each item to a standard form and use it as a dict key.",
          "Signal 5: a brute force you wrote has a nested loop where the inner loop only searches for one value. That inner search can almost always become a hash lookup.",
          "Signal 6: 'longest consecutive sequence' in O(n), no sorting allowed. Think set plus 'only start counting from the start of a run'."
        ]
      },
      {
        h: "Counting with dict and Counter",
        p: [
          "To count, use `count[ch] = count.get(ch, 0) + 1`. `get` returns 0 when the key is missing so you do not crash with KeyError.",
          "`Counter(s)` from `collections` does the same thing in one line. Two strings are anagrams exactly when their Counters are equal.",
          "Counting is O(n) time and O(k) space where k is the number of distinct keys. For lowercase letters k is at most 26, so space is effectively O(1)."
        ],
        code: `from collections import Counter

s, t = "anagram", "nagaram"
count = {}
for ch in s:
    count[ch] = count.get(ch, 0) + 1
print(count)
print(Counter(s) == Counter(t))
print(Counter("banana").most_common(1))`,
        out: "{'a': 3, 'n': 1, 'g': 1, 'r': 1, 'm': 1}\nTrue\n[('a', 3)]"
      },
      {
        h: "Canonical keys: grouping equivalent things",
        p: [
          "Group Anagrams asks you to put 'eat', 'tea' and 'ate' together. They look different but share one canonical form: their sorted letters 'aet'.",
          "Use that canonical form as the dict key and append the original word to the list for that key. `defaultdict(list)` creates the empty list for you on first access.",
          "Dict keys must be hashable: strings, numbers and tuples work; lists do not. If your key is a count array, convert it with `tuple(counts)`."
        ],
        code: `from collections import defaultdict

words = ["eat", "tea", "tan", "ate", "nat", "bat"]
groups = defaultdict(list)
for w in words:
    key = "".join(sorted(w))
    groups[key].append(w)
print(list(groups.values()))`,
        out: "[['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]"
      },
      {
        h: "Set plus sequence start",
        p: [
          "Longest Consecutive Sequence wants O(n). Put all numbers in a set. A number `x` starts a run only if `x - 1` is NOT in the set.",
          "From each start, count upward while `x + length` is in the set. Every number is visited by at most one counting loop, so the total work is O(n) even though there is a while inside a for.",
          "Skipping non-starts is the whole trick. Without that check the same run gets recounted from every member and the time becomes O(n^2)."
        ],
        code: `def longest_consecutive(nums):
    s = set(nums)
    best = 0
    for x in s:
        if x - 1 not in s:
            length = 1
            while x + length in s:
                length += 1
            best = max(best, length)
    return best

print(longest_consecutive([100, 4, 200, 1, 3, 2]))
print(longest_consecutive([]))`,
        out: "4\n0"
      }
    ],
    template: `def complement_lookup(nums, target):
    seen = {}  # value -> index where we saw it
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:          # O(1) check instead of an inner loop
            return [seen[need], i]
        seen[x] = i               # store AFTER checking, so x does not pair with itself
    return []


def frequency(items):
    count = {}
    for it in items:
        count[it] = count.get(it, 0) + 1
    return count


print(complement_lookup([2, 7, 11, 15], 9))
print(frequency("hello"))`,
    example: {
      name: "Two Sum",
      n: 3,
      steps: [
        "Problem: given `nums` and `target`, return indices of the two numbers that add up to target. Exactly one answer exists.",
        "Brute force: try every pair with two loops, O(n^2). The inner loop is only searching for one value, `target - nums[i]`. That is the hashing signal.",
        "Plan: one pass. Keep `seen` mapping value to index. For each `x` at index `i`, compute `need = target - x`. If `need` is in `seen`, answer is `[seen[need], i]`. Otherwise store `seen[x] = i`.",
        "Dry run on nums = [3, 2, 4], target = 6.",
        "i=0, x=3: need=3. seen is empty, so no match. Store seen = {3: 0}. Note: we check before storing, so 3 does not pair with itself.",
        "i=1, x=2: need=4. 4 not in seen. Store seen = {3: 0, 2: 1}.",
        "i=2, x=4: need=2. 2 is in seen at index 1. Return [1, 2].",
        "Time O(n), one pass. Space O(n) for the dict."
      ],
      code: `def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
    return []

print(two_sum([2, 7, 11, 15], 9))
print(two_sum([3, 2, 4], 6))
print(two_sum([3, 3], 6))`
    },
    mistakes: [
      "Storing `x` in the dict before checking for its complement, so `[3, 2, 4]` with target 6 wrongly pairs 3 with itself.",
      "Using a list for `seen` and writing `if need in seen_list`, which is O(n) per check and brings back O(n^2).",
      "Trying to use a list as a dict key. Convert to `tuple(...)` or a string first.",
      "Forgetting `count.get(key, 0)` and getting KeyError on the first occurrence (or use `defaultdict(int)` / `Counter`).",
      "In Longest Consecutive Sequence, counting from every number instead of only from run starts, which makes it O(n^2).",
      "Sorting when the problem asks for O(n). Sorting is O(n log n); a set is the O(n) answer."
    ],
    practice: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    quiz: [
      {
        q: "You wrote two nested loops where the inner loop searches for `target - nums[i]`. What is the standard fix?",
        options: ["Sort the array and use binary search for every element", "Store seen values in a dict and look up the complement in O(1)", "Use recursion", "Use a second list to copy the array"],
        answer: 1,
        why: "The inner loop only looks for one value, so a dict lookup replaces it and the whole thing becomes O(n)."
      },
      {
        q: "Which key correctly groups 'listen' and 'silent' together in Group Anagrams?",
        options: ["`len(word)`", "`word[0]`", "`\"\".join(sorted(word))`", "`set(word)`"],
        answer: 2,
        why: "Sorted letters give the same string for every anagram. Length and first letter collide with non-anagrams, and `set` is unhashable and also ignores repeated letters."
      },
      {
        q: "In Longest Consecutive Sequence, why do we only start counting when `x - 1` is not in the set?",
        options: ["To skip negative numbers", "So every run is counted once, keeping total work O(n)", "Because sets are unordered", "To avoid KeyError"],
        answer: 1,
        why: "Only the smallest number of each run starts a count, so each element is touched by at most one inner loop."
      }
    ]
  },

  {
    id: "prefix-kadane",
    track: "Patterns",
    order: 8,
    week: 2,
    title: "Prefix sums and Kadane's algorithm",
    minutes: 60,
    goal: "After this lesson you can answer range-sum and subarray-sum questions with prefix sums, and find the best subarray or best buy-sell pair in one pass.",
    why: "Subarray sum questions appear constantly in OAs, and the prefix-sum-plus-hashmap trick is the expected O(n) answer. Kadane and running-min are one-pass solutions interviewers love to see you derive.",
    sections: [
      {
        h: "Prefix sums: precompute once, answer ranges in O(1)",
        p: [
          "Build `prefix` where `prefix[i]` is the sum of the first i elements. Start with `[0]` so the math has no special cases.",
          "Then the sum of `nums[l..r]` (inclusive) is `prefix[r + 1] - prefix[l]`. One subtraction instead of a loop.",
          "Building takes O(n). After that every range query is O(1). This matters when you have many queries or when you need to compare many subarrays."
        ],
        code: `nums = [2, 4, 1, 3, 5]
prefix = [0]
for x in nums:
    prefix.append(prefix[-1] + x)
print(prefix)

# sum of nums[1..3] inclusive = 4 + 1 + 3
l, r = 1, 3
print(prefix[r + 1] - prefix[l])`,
        out: "[0, 2, 6, 7, 10, 15]\n8"
      },
      {
        h: "How to recognise it",
        p: [
          "Signal 1: 'sum of elements between i and j', many range queries. Think prefix array.",
          "Signal 2: 'count subarrays whose sum equals k' (especially with negative numbers). Think prefix sum plus a hashmap of how many times each prefix appeared.",
          "Signal 3: 'maximum sum contiguous subarray'. Think Kadane: at each index, either extend the current subarray or start fresh.",
          "Signal 4: 'buy once, sell later, maximum profit'. Think running minimum: best profit if I sell today is today's price minus the cheapest price before today.",
          "Signal 5: 'product of all elements except itself, no division'. Think prefix products from the left times suffix products from the right.",
          "Note: if all numbers are positive and you want a sum at least or at most k, sliding window is often simpler. Negative numbers break sliding window, and that is when prefix sums shine."
        ]
      },
      {
        h: "Kadane's algorithm",
        p: [
          "Keep `cur` = best sum of a subarray that ENDS at the current index. For the next number `x`, there are only two choices: extend (`cur + x`) or start over (`x`). Take the larger.",
          "Keep `best` = the largest `cur` ever seen. That is the answer.",
          "Start both from `nums[0]`, not 0. If every number is negative, the answer is the largest single number, and starting from 0 would wrongly return 0."
        ],
        code: `def max_subarray(nums):
    cur = best = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best

print(max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]))
print(max_subarray([-3, -1, -2]))`,
        out: "6\n-1"
      },
      {
        h: "Running minimum: Best Time to Buy and Sell Stock",
        p: [
          "If you sell on day i, the best buy day is the cheapest day before it. So walk left to right, keep `min_price` so far, and compute `p - min_price` each day.",
          "This is the same shape as Kadane: one pass, carry a small summary of the past, update the answer."
        ],
        code: `def max_profit(prices):
    min_price = float("inf")
    best = 0
    for p in prices:
        min_price = min(min_price, p)
        best = max(best, p - min_price)
    return best

print(max_profit([7, 1, 5, 3, 6, 4]))
print(max_profit([7, 6, 4, 3, 1]))`,
        out: "5\n0"
      },
      {
        h: "Prefix times suffix: Product of Array Except Self",
        p: [
          "The answer at i is (product of everything left of i) times (product of everything right of i).",
          "First pass left to right: write the left product into `ans[i]`, then multiply `left` by `nums[i]`. Second pass right to left: multiply `ans[i]` by the right product. No division, O(n) time, O(1) extra space besides the output."
        ],
        code: `def product_except_self(nums):
    n = len(nums)
    ans = [1] * n
    left = 1
    for i in range(n):
        ans[i] = left
        left *= nums[i]
    right = 1
    for i in range(n - 1, -1, -1):
        ans[i] *= right
        right *= nums[i]
    return ans

print(product_except_self([1, 2, 3, 4]))`,
        out: "[24, 12, 8, 6]"
      }
    ],
    template: `def count_subarrays_with_sum(nums, k):
    counts = {0: 1}   # prefix sum -> how many times seen; the empty prefix has sum 0
    running = 0
    total = 0
    for x in nums:
        running += x
        total += counts.get(running - k, 0)   # earlier prefixes that make a sum of k
        counts[running] = counts.get(running, 0) + 1
    return total


def kadane(nums):
    cur = best = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best


print(count_subarrays_with_sum([1, 1, 1], 2))
print(kadane([5, -9, 6, -2, 3]))`,
    example: {
      name: "Subarray Sum Equals K",
      n: 13,
      steps: [
        "Problem: count contiguous subarrays whose sum is exactly k. Numbers can be negative.",
        "Key fact: sum of subarray (j, i] = prefix[i] - prefix[j]. We want prefix[i] - prefix[j] = k, i.e. prefix[j] = prefix[i] - k.",
        "So while walking, for each running prefix sum we ask: how many earlier prefixes equal `running - k`? A dict of prefix counts answers in O(1).",
        "Seed `counts = {0: 1}`. This represents the empty prefix and lets subarrays that start at index 0 be counted.",
        "Dry run on nums = [1, 2, 3], k = 3.",
        "x=1: running=1, need 1-3=-2, count 0. total=0. counts={0:1, 1:1}.",
        "x=2: running=3, need 0, counts[0]=1, so total=1 (subarray [1,2]). counts={0:1, 1:1, 3:1}.",
        "x=3: running=6, need 3, counts[3]=1, so total=2 (subarray [3]). counts adds 6.",
        "Answer 2. Time O(n), space O(n). Sliding window would fail here because negatives make the window sum non-monotonic."
      ],
      code: `def subarray_sum(nums, k):
    counts = {0: 1}
    running = 0
    total = 0
    for x in nums:
        running += x
        total += counts.get(running - k, 0)
        counts[running] = counts.get(running, 0) + 1
    return total

print(subarray_sum([1, 2, 3], 3))
print(subarray_sum([1, 1, 1], 2))
print(subarray_sum([1, -1, 0], 0))`
    },
    mistakes: [
      "Forgetting to seed `counts = {0: 1}`, which misses every subarray that starts at index 0.",
      "Updating `counts[running]` before reading `counts[running - k]`; with k = 0 this counts an empty subarray.",
      "Initialising Kadane's `best` to 0, which returns 0 for an all-negative array instead of the largest element.",
      "Using a sliding window for subarray sum when the array has negative numbers.",
      "Off-by-one in range sums: with a leading 0 in prefix, sum of nums[l..r] is `prefix[r + 1] - prefix[l]`."
    ],
    practice: [11, 12, 13, 6],
    quiz: [
      {
        q: "With `prefix = [0, 2, 6, 7, 10, 15]` built from `[2, 4, 1, 3, 5]`, what is the sum of nums[2..4]?",
        options: ["9", "13", "8", "15"],
        answer: 0,
        why: "prefix[5] - prefix[2] = 15 - 6 = 9, which is 1 + 3 + 5."
      },
      {
        q: "In Kadane's algorithm, what does `cur` represent?",
        options: ["The best sum seen anywhere so far", "The best sum of a subarray ending exactly at the current index", "The total sum of the array so far", "The smallest prefix so far"],
        answer: 1,
        why: "`cur` is the best subarray ending here; `best` tracks the overall maximum."
      },
      {
        q: "Why does Subarray Sum Equals K need prefix sums plus a hashmap instead of a sliding window?",
        options: ["Because the array is unsorted", "Because numbers can be negative, so growing the window does not always increase the sum", "Because k can be large", "Because hashmaps are always faster"],
        answer: 1,
        why: "Sliding window relies on the sum only growing when you expand. Negatives break that, so we count matching prefixes instead."
      }
    ]
  },

  {
    id: "two-pointers",
    track: "Patterns",
    order: 9,
    week: 3,
    title: "Two pointers",
    minutes: 70,
    goal: "After this lesson you can use converging pointers on sorted data and a slow write pointer for in-place filtering, and explain why each pointer move is safe.",
    why: "Two pointers turns many O(n^2) pair searches into O(n) with O(1) extra space. Interviewers often ask for the in-place, no-extra-memory version, which is exactly this pattern.",
    sections: [
      {
        h: "Two shapes of two pointers",
        p: [
          "Shape 1, converging: `l` starts at 0, `r` starts at the end, and they walk toward each other. Used for palindromes, pair sums on sorted arrays, and 'which side do I give up' problems like Container With Most Water.",
          "Shape 2, slow/fast (reader/writer): `r` reads every element, `w` marks where the next kept element should be written. Used to remove, dedupe or move elements in place.",
          "Both are O(n) because each pointer only moves forward (or only inward) and never resets."
        ],
        code: `def is_palindrome(s):
    l, r = 0, len(s) - 1
    while l < r:
        if not s[l].isalnum():
            l += 1
        elif not s[r].isalnum():
            r -= 1
        elif s[l].lower() != s[r].lower():
            return False
        else:
            l += 1
            r -= 1
    return True

print(is_palindrome("A man, a plan, a canal: Panama"))
print(is_palindrome("race a car"))`,
        out: "True\nFalse"
      },
      {
        h: "How to recognise it",
        p: [
          "Signal 1: the input is SORTED (or you are allowed to sort) and you need a pair or triple with some sum. Think converging pointers.",
          "Signal 2: 'palindrome', 'reverse', 'compare from both ends'. Think converging pointers.",
          "Signal 3: 'in place', 'O(1) extra space', 'remove duplicates', 'move zeroes', 'remove element'. Think slow write pointer.",
          "Signal 4: two sequences walked together, like 'is s a subsequence of t' or 'merge two sorted arrays'. Think one index per sequence.",
          "Signal 5: 'maximise area/width between two lines'. Think converging pointers and move the side that limits you.",
          "Not this pattern: unsorted pair sum with indices required (use a hashmap, Two Sum), or 'contiguous subarray with a condition' (that is sliding window, a cousin of two pointers)."
        ]
      },
      {
        h: "Converging on a sorted array",
        p: [
          "Two Sum II: array is sorted. If `nums[l] + nums[r]` is too small, the only way to grow it is `l += 1` (r is already the biggest available). If too big, `r -= 1`.",
          "Each step throws away one candidate that provably cannot be part of an answer, so we never miss the pair."
        ],
        code: `def two_sum_sorted(nums, target):
    l, r = 0, len(nums) - 1
    while l < r:
        s = nums[l] + nums[r]
        if s == target:
            return [l + 1, r + 1]   # problem uses 1-based indices
        if s < target:
            l += 1
        else:
            r -= 1
    return []

print(two_sum_sorted([2, 7, 11, 15], 9))
print(two_sum_sorted([1, 3, 4, 5, 7, 11], 9))`,
        out: "[1, 2]\n[3, 4]"
      },
      {
        h: "Slow write pointer for in-place edits",
        p: [
          "Remove Duplicates from Sorted Array: `w` is the length of the cleaned prefix. Read with `r`; if `nums[r]` differs from the last kept value `nums[w - 1]`, write it at `nums[w]` and grow `w`.",
          "Move Zeroes: swap each non-zero into position `w`. Non-zeros keep their order and zeros drift to the end.",
          "Return `w` when the problem asks for the new length. Anything after index `w - 1` is ignored."
        ],
        code: `def remove_duplicates(nums):
    if not nums:
        return 0
    w = 1
    for r in range(1, len(nums)):
        if nums[r] != nums[w - 1]:
            nums[w] = nums[r]
            w += 1
    return w

def move_zeroes(nums):
    w = 0
    for r in range(len(nums)):
        if nums[r] != 0:
            nums[w], nums[r] = nums[r], nums[w]
            w += 1

a = [0, 0, 1, 1, 1, 2, 2, 3]
k = remove_duplicates(a)
print(k, a[:k])
b = [0, 1, 0, 3, 12]
move_zeroes(b)
print(b)`,
        out: "4 [0, 1, 2, 3]\n[1, 3, 12, 0, 0]"
      },
      {
        h: "Move the side that limits you",
        p: [
          "Container With Most Water: area = width times the SHORTER height. Start with the widest container.",
          "Moving the taller line inward can never help: width shrinks and height is still capped by the shorter line. So always move the shorter line. That one argument is what makes the greedy O(n) correct, and interviewers will ask you to say it.",
          "Trapping Rain Water uses the same idea with `left_max` and `right_max`: process the side with the smaller max because its water level is already decided."
        ],
        code: `def max_area(height):
    l, r = 0, len(height) - 1
    best = 0
    while l < r:
        best = max(best, (r - l) * min(height[l], height[r]))
        if height[l] < height[r]:
            l += 1
        else:
            r -= 1
    return best

print(max_area([1, 8, 6, 2, 5, 4, 8, 3, 7]))`,
        out: "49"
      }
    ],
    template: `def converging(nums, target):
    nums.sort()
    l, r = 0, len(nums) - 1
    while l < r:
        s = nums[l] + nums[r]
        if s == target:
            return (nums[l], nums[r])
        if s < target:
            l += 1        # need a bigger sum
        else:
            r -= 1        # need a smaller sum
    return None


def keep_if(nums, keep):
    w = 0                 # next write position
    for r in range(len(nums)):
        if keep(nums[r]):
            nums[w] = nums[r]
            w += 1
    return w              # new length


print(converging([8, 1, 5, 3], 9))
arr = [3, 2, 2, 3, 4]
k = keep_if(arr, lambda x: x != 3)
print(arr[:k])`,
    example: {
      name: "3Sum",
      n: 19,
      steps: [
        "Problem: return all unique triplets [a, b, c] with a + b + c = 0. No duplicate triplets.",
        "Sort first. Then fix the first number `nums[i]` and the problem becomes Two Sum II on the part to the right: find `l, r` with `nums[l] + nums[r] = -nums[i]`.",
        "Duplicates: skip `i` if `nums[i] == nums[i - 1]`. After finding a triplet, move `l` past equal values so the same pair is not reported twice.",
        "Early exit: if `nums[i] > 0`, every number to the right is also positive, so no triplet can sum to 0.",
        "Dry run on [-1, 0, 1, 2, -1, -4]. Sorted: [-4, -1, -1, 0, 1, 2].",
        "i=0 (-4): need 4. l=1, r=5: -1+2=1 < 4, l++. -1+2=1, l++. 0+2=2, l++. 1+2=3, l++. l meets r, nothing found.",
        "i=1 (-1): need 1. l=2 (-1), r=5 (2): sum 1, found [-1, -1, 2]. Move l to 3, r to 4. 0+1=1, found [-1, 0, 1]. l=4, r=3, stop.",
        "i=2 (-1): same as previous value, skip.",
        "i=3 (0): need 0. l=4 (1), r=5 (2): 3 > 0, r--. l meets r, stop. i=4 has fewer than 2 numbers to its right, so the loop ends.",
        "Answer [[-1, -1, 2], [-1, 0, 1]]. Time O(n^2): sort is O(n log n), then O(n) two-pointer scan for each i."
      ],
      code: `def three_sum(nums):
    nums.sort()
    res = []
    n = len(nums)
    for i in range(n - 2):
        if nums[i] > 0:
            break
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        l, r = i + 1, n - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0:
                l += 1
            elif s > 0:
                r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                l += 1
                r -= 1
                while l < r and nums[l] == nums[l - 1]:
                    l += 1
    return res

print(three_sum([-1, 0, 1, 2, -1, -4]))
print(three_sum([0, 0, 0, 0]))
print(three_sum([0, 1, 1]))`
    },
    mistakes: [
      "Using converging pointers on an unsorted array. The 'too small, move left' logic only works when the data is sorted.",
      "In 3Sum, forgetting to skip duplicate values for both `i` and `l`, which produces repeated triplets.",
      "Using `while l <= r` for pair problems, which lets an element pair with itself.",
      "In Container With Most Water, moving the taller side or both sides, which can skip the optimal pair.",
      "Building a new list when the problem says in place; the judge checks the original array.",
      "For Merge Sorted Array, filling from the front and overwriting values you still need. Fill from the back."
    ],
    practice: [17, 22, 23, 24, 18, 19, 20, 26, 21, 14, 15, 16, 25],
    quiz: [
      {
        q: "In Two Sum II (sorted), `nums[l] + nums[r]` is smaller than target. What do you do?",
        options: ["r -= 1", "l += 1", "Move both pointers", "Restart with l = 0"],
        answer: 1,
        why: "`nums[r]` is the largest value still available, so the only way to increase the sum is a bigger left value."
      },
      {
        q: "Why does Container With Most Water move the shorter line?",
        options: ["It is faster to compute", "Moving the taller line can never produce a larger area, since height stays capped by the shorter line while width shrinks", "The shorter line is always on the left", "To avoid duplicates"],
        answer: 1,
        why: "Every container using the shorter line with a closer partner is worse, so we can safely discard that line."
      },
      {
        q: "Which signal points to a slow write pointer?",
        options: ["'Return all subsets'", "'Remove duplicates in place using O(1) extra space'", "'Find shortest path'", "'Count subarrays with sum k'"],
        answer: 1,
        why: "In-place filtering is the classic reader/writer pointer use."
      }
    ]
  },

  {
    id: "sliding-window",
    track: "Patterns",
    order: 10,
    week: 4,
    title: "Sliding window (fixed and variable)",
    minutes: 75,
    goal: "After this lesson you can solve contiguous subarray and substring problems in O(n) with a fixed-size or a grow-and-shrink window.",
    why: "'Longest/shortest substring with a condition' is one of the most frequent medium questions in OAs. The variable window template solves a whole family of them with the same skeleton.",
    sections: [
      {
        h: "Fixed window: slide, do not recompute",
        p: [
          "When the window size k is given, compute the first window once, then for each step add the element entering on the right and subtract the one leaving on the left.",
          "That makes each step O(1) instead of O(k), so the whole scan is O(n)."
        ],
        code: `def find_max_average(nums, k):
    window = sum(nums[:k])
    best = window
    for i in range(k, len(nums)):
        window += nums[i] - nums[i - k]   # add new, remove old
        best = max(best, window)
    return best / k

print(find_max_average([1, 12, -5, -6, 50, 3], 4))`,
        out: "12.75"
      },
      {
        h: "How to recognise it",
        p: [
          "Signal 1: the answer is a CONTIGUOUS subarray or substring. Words like 'substring', 'subarray', 'consecutive', 'window'.",
          "Signal 2: 'of size k' or 'length k'. Fixed window.",
          "Signal 3: 'longest' or 'maximum length' with a condition ('without repeating', 'at most k distinct', 'at most k zeros', 'at most k replacements'). Variable window: grow right, shrink left while INVALID, record after shrinking.",
          "Signal 4: 'shortest' or 'minimum length' such that sum/count reaches a target. Variable window: grow right, and WHILE VALID record the answer and shrink left.",
          "Signal 5: 'contains a permutation/anagram of p'. Fixed window of len(p) with character counts.",
          "Warning: if numbers can be negative and the condition is about sums, the window is not monotonic. Use prefix sums instead."
        ]
      },
      {
        h: "Variable window, shortest valid: shrink while valid",
        p: [
          "Minimum Size Subarray Sum (all positive): extend `r`, add to `total`. As long as `total >= target`, the window is valid, so record its length and then shrink from the left to try to find a shorter one.",
          "Each index enters once and leaves once, so the while inside the for is still O(n) overall."
        ],
        code: `def min_sub_array_len(target, nums):
    l = 0
    total = 0
    best = float("inf")
    for r in range(len(nums)):
        total += nums[r]
        while total >= target:
            best = min(best, r - l + 1)
            total -= nums[l]
            l += 1
    return 0 if best == float("inf") else best

print(min_sub_array_len(7, [2, 3, 1, 2, 4, 3]))
print(min_sub_array_len(100, [1, 2, 3]))`,
        out: "2\n0"
      },
      {
        h: "Variable window, longest valid: 'at most k'",
        p: [
          "Max Consecutive Ones III: the longest run of 1s if you may flip at most k zeros. Rephrase: longest window with at most k zeros.",
          "Grow `r`, count zeros. While zeros > k the window is invalid, so shrink from the left. After the while, the window is valid: record its length.",
          "Fruit Into Baskets (at most 2 distinct) and Longest Repeating Character Replacement (window length minus max frequency at most k) are the same skeleton with a different validity check."
        ],
        code: `def longest_ones(nums, k):
    l = 0
    zeros = 0
    best = 0
    for r in range(len(nums)):
        if nums[r] == 0:
            zeros += 1
        while zeros > k:
            if nums[l] == 0:
                zeros -= 1
            l += 1
        best = max(best, r - l + 1)
    return best

print(longest_ones([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2))`,
        out: "6"
      },
      {
        h: "Fixed window with counts, and the monotonic deque",
        p: [
          "Permutation in String: slide a window of `len(s1)` over `s2` and keep a Counter of the window. When it equals the Counter of `s1`, a permutation is present.",
          "Sliding Window Maximum needs the max of each window. Keep a deque of indices whose values are decreasing. Pop smaller values from the back before adding a new one (they can never be the max again), and pop the front when it falls out of the window. The front is always the max. O(n) total."
        ],
        code: `from collections import Counter, deque

def check_inclusion(s1, s2):
    k = len(s1)
    need = Counter(s1)
    window = Counter(s2[:k])
    if window == need:
        return True
    for i in range(k, len(s2)):
        window[s2[i]] += 1
        window[s2[i - k]] -= 1
        if window[s2[i - k]] == 0:
            del window[s2[i - k]]
        if window == need:
            return True
    return False

def max_sliding_window(nums, k):
    dq = deque()   # indices, values decreasing from front to back
    res = []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            res.append(nums[dq[0]])
    return res

print(check_inclusion("ab", "eidbaooo"), check_inclusion("ab", "eidboaoo"))
print(max_sliding_window([1, 3, -1, -3, 5, 3, 6, 7], 3))`,
        out: "True False\n[3, 3, 5, 5, 6, 7]"
      }
    ],
    template: `def longest_valid_window(s):
    state = {}          # whatever you need to judge validity (counts, sum, zeros...)
    l = 0
    best = 0
    for r in range(len(s)):
        state[s[r]] = state.get(s[r], 0) + 1          # 1. add s[r]
        while state[s[r]] > 1:                        # 2. shrink while INVALID
            state[s[l]] -= 1
            l += 1
        best = max(best, r - l + 1)                   # 3. window valid: record
    return best


print(longest_valid_window("abcabcbb"))`,
    example: {
      name: "Longest Substring Without Repeating Characters",
      n: 27,
      steps: [
        "Problem: length of the longest substring with all distinct characters.",
        "Signals: 'substring' (contiguous) plus 'longest' plus a condition. Variable window, longest-valid shape.",
        "State: a set `window` of the characters currently inside s[l..r]. Valid means no duplicates.",
        "For each `r`: while `s[r]` is already in the set, remove `s[l]` and move `l` right. Then add `s[r]` and record `r - l + 1`.",
        "Dry run on 'abcabcbb'.",
        "r=0 'a': add, window 'a', best 1. r=1 'b': 'ab', best 2. r=2 'c': 'abc', best 3.",
        "r=3 'a': 'a' is in the set, remove s[0]='a', l=1. Add 'a', window 'bca', length 3.",
        "r=4 'b': remove 'b', l=2, window 'cab'. r=5 'c': remove 'c', l=3, window 'abc'. Length stays 3.",
        "r=6 'b': remove 'a' (l=4), then 'b' (l=5); window 'cb', length 2. r=7 'b': remove 'c' (l=6), 'b' (l=7); window 'b'.",
        "Answer 3. Each character is added and removed at most once: O(n) time, O(alphabet) space."
      ],
      code: `def length_of_longest_substring(s):
    window = set()
    l = 0
    best = 0
    for r in range(len(s)):
        while s[r] in window:
            window.remove(s[l])
            l += 1
        window.add(s[r])
        best = max(best, r - l + 1)
    return best

print(length_of_longest_substring("abcabcbb"))
print(length_of_longest_substring("bbbbb"))
print(length_of_longest_substring("pwwkew"))
print(length_of_longest_substring(""))`
    },
    mistakes: [
      "Using `if` instead of `while` when shrinking; one step left may not be enough to make the window valid again.",
      "Recording the answer in the wrong place: for 'longest' record after the shrink loop, for 'shortest' record inside it.",
      "Recomputing `sum(nums[l:r+1])` every step, which turns O(n) into O(n*k).",
      "Using a sliding window on sums with negative numbers.",
      "Window length off by one: it is `r - l + 1`, not `r - l`.",
      "Forgetting to remove or decrement the count of the element leaving on the left."
    ],
    practice: [31, 27, 28, 29, 32, 33, 34, 30, 35],
    quiz: [
      {
        q: "For 'shortest subarray with sum at least target' (all positive), where do you update the answer?",
        options: ["After the shrink loop", "Inside the while-valid loop, before shrinking", "Only at the end", "Before adding nums[r]"],
        answer: 1,
        why: "Every valid window is a candidate for 'shortest', so record it, then shrink to look for a smaller valid one."
      },
      {
        q: "Max Consecutive Ones III (flip at most k zeros) is best rephrased as:",
        options: ["Count the zeros in the array", "Longest window containing at most k zeros", "Shortest window with k ones", "Sort and take the k largest"],
        answer: 1,
        why: "Rephrasing as an 'at most k' condition makes it the standard longest-valid window."
      },
      {
        q: "Why is a variable sliding window O(n) even with a while loop inside the for loop?",
        options: ["Python optimises nested loops", "Each index enters the window once and leaves at most once", "The while loop runs only once", "It is actually O(n log n)"],
        answer: 1,
        why: "`l` and `r` only move forward, so total pointer moves are at most 2n."
      }
    ]
  },

  {
    id: "stack",
    track: "Patterns",
    order: 11,
    week: 3,
    title: "Stacks and monotonic stacks",
    minutes: 70,
    goal: "After this lesson you can use a stack for matching and nesting problems, and a monotonic stack for 'next greater / next smaller' problems in O(n).",
    why: "Bracket matching and next-greater-element are very common OA problems. The monotonic stack is a pattern beginners rarely discover on their own, so knowing it gives you a clear edge.",
    sections: [
      {
        h: "Stack basics in Python",
        p: [
          "A Python list is a stack: `append` pushes, `pop()` removes the top, `stack[-1]` peeks. All O(1). Always check `if stack` before peeking or popping.",
          "A stack remembers the most recent unfinished thing. In Valid Parentheses, the most recent open bracket must be closed first, which is exactly last-in, first-out."
        ],
        code: `def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:                       # closing bracket
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
        else:                                 # opening bracket
            stack.append(ch)
    return not stack                          # leftovers mean unclosed brackets

print(is_valid("()[]{}"), is_valid("([)]"), is_valid("(("))`,
        out: "True False False"
      },
      {
        h: "How to recognise it",
        p: [
          "Signal 1: matching or nesting: brackets, tags, 'decode k[...]', undo operations. Think plain stack.",
          "Signal 2: evaluate an expression in postfix (Reverse Polish Notation). Think operand stack.",
          "Signal 3: 'next greater element', 'how many days until a warmer temperature', 'previous smaller'. Think monotonic stack.",
          "Signal 4: 'largest rectangle', 'how far can this bar extend'. Think monotonic increasing stack: when a bar is popped, you know both its left and right boundaries.",
          "Signal 5: a design question that needs O(1) `getMin`. Think storing extra info (the running min) alongside each pushed value.",
          "Signal 6: your brute force for each i scans right to find the first bigger or smaller value. That inner scan is what a monotonic stack removes."
        ]
      },
      {
        h: "Store extra state with each item: Min Stack",
        p: [
          "To get the minimum in O(1), push a pair `(value, min_so_far)`. The min at the top is always the min of the whole stack, and popping automatically restores the previous min.",
          "This 'push a tuple of state' idea comes back in Decode String and Car Fleet."
        ],
        code: `class MinStack:
    def __init__(self):
        self.st = []   # (value, min of stack up to here)

    def push(self, val):
        m = val if not self.st else min(val, self.st[-1][1])
        self.st.append((val, m))

    def pop(self):
        self.st.pop()

    def top(self):
        return self.st[-1][0]

    def getMin(self):
        return self.st[-1][1]

ms = MinStack()
for v in [5, 2, 7, 1]:
    ms.push(v)
print(ms.getMin())
ms.pop()
print(ms.getMin(), ms.top())`,
        out: "1\n2 7"
      },
      {
        h: "Monotonic stack: next greater element",
        p: [
          "Keep a stack of INDICES that are still waiting for their next greater value. Their values are decreasing from bottom to top.",
          "When a new value `x` arrives, it is the answer for every waiting index with a smaller value. Pop them and record `x`. Then push the current index.",
          "Every index is pushed once and popped at most once, so the total is O(n), not O(n^2).",
          "For Largest Rectangle in Histogram, keep the stack increasing instead. When a bar is popped because a shorter bar arrived, the shorter bar is its right boundary and the new stack top is its left boundary."
        ],
        code: `def next_greater(nums):
    res = [-1] * len(nums)
    stack = []   # indices waiting for a bigger value
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            res[stack.pop()] = x
        stack.append(i)
    return res

print(next_greater([2, 1, 2, 4, 3]))`,
        out: "[4, 2, 4, -1, -1]"
      },
      {
        h: "Nesting with saved context: Decode String",
        p: [
          "On '[', save the current string and the repeat count on the stack, then start a fresh string for the inside.",
          "On ']', pop the saved context and build `prev + cur * times`. Digits can have more than one character, so build the number with `k = k * 10 + int(ch)`."
        ],
        code: `def decode_string(s):
    stack = []
    cur = ""
    k = 0
    for ch in s:
        if ch.isdigit():
            k = k * 10 + int(ch)
        elif ch == "[":
            stack.append((cur, k))
            cur, k = "", 0
        elif ch == "]":
            prev, times = stack.pop()
            cur = prev + cur * times
        else:
            cur += ch
    return cur

print(decode_string("3[a]2[bc]"))
print(decode_string("3[a2[c]]"))
print(decode_string("10[x]"))`,
        out: "aaabcbc\naccaccacc\nxxxxxxxxxx"
      }
    ],
    template: `def monotonic_next_greater(nums):
    res = [-1] * len(nums)        # default when nothing greater exists
    stack = []                    # indices; their values decrease bottom -> top
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:   # x resolves smaller waiting items
            j = stack.pop()
            res[j] = x            # or i - j for 'how many steps until'
        stack.append(i)
    return res


print(monotonic_next_greater([1, 5, 3, 4, 2]))`,
    example: {
      name: "Daily Temperatures",
      n: 39,
      steps: [
        "Problem: for each day, how many days until a warmer temperature? 0 if never.",
        "Signal: 'next warmer' is 'next greater'. Brute force scans right from each day: O(n^2). Use a monotonic decreasing stack of indices.",
        "For day i with temperature t: while the stack top has a colder temperature, pop index j and set `ans[j] = i - j`. Then push i.",
        "Dry run on [73, 74, 75, 71, 69, 72, 76, 73].",
        "i=0 (73): stack empty, push. stack=[0].",
        "i=1 (74): 74 > 73, pop 0, ans[0]=1. push 1. i=2 (75): pop 1, ans[1]=1. push 2. stack=[2].",
        "i=3 (71): not warmer than 75, push. i=4 (69): push. stack=[2, 3, 4] with temps 75, 71, 69 (decreasing).",
        "i=5 (72): pop 4 (69), ans[4]=1. pop 3 (71), ans[3]=2. 75 is not colder, stop. push 5. stack=[2, 5].",
        "i=6 (76): pop 5, ans[5]=1. pop 2, ans[2]=4. push 6. i=7 (73): push. stack=[6, 7].",
        "Indices left on the stack never found a warmer day, so they keep 0. Answer [1, 1, 4, 2, 1, 1, 0, 0]. O(n) time and space."
      ],
      code: `def daily_temperatures(temperatures):
    ans = [0] * len(temperatures)
    stack = []   # indices with no warmer day found yet
    for i, t in enumerate(temperatures):
        while stack and temperatures[stack[-1]] < t:
            j = stack.pop()
            ans[j] = i - j
        stack.append(i)
    return ans

print(daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73]))
print(daily_temperatures([30, 40, 50, 60]))
print(daily_temperatures([30, 20, 10]))`
    },
    mistakes: [
      "Peeking or popping an empty stack. Always guard with `if stack` / `while stack and ...`.",
      "Returning True in Valid Parentheses without checking the stack is empty at the end, so '((' passes.",
      "Pushing values instead of indices in a monotonic stack when the answer needs a distance like `i - j`.",
      "Using `<=` vs `<` carelessly in the pop condition; it decides how equal values are handled (strictly greater vs greater-or-equal).",
      "In Evaluate RPN, popping operands in the wrong order for `-` and `/`; the first pop is the right operand. Use `int(a / b)` to truncate toward zero.",
      "Reading multi-digit numbers one digit at a time in Decode String."
    ],
    practice: [36, 37, 38, 40, 39, 41, 42, 43, 44],
    quiz: [
      {
        q: "What does the stack hold in Daily Temperatures?",
        options: ["All temperatures seen so far, sorted", "Indices of days still waiting for a warmer day", "The answer array", "Only the maximum temperature"],
        answer: 1,
        why: "Each index waits on the stack until a warmer day pops it and fills in `i - j`."
      },
      {
        q: "Why is the monotonic stack solution O(n)?",
        options: ["The while loop runs at most once per iteration", "Each index is pushed once and popped at most once", "Python lists are fast", "Because the input is sorted"],
        answer: 1,
        why: "Total pushes plus pops is at most 2n across the whole run."
      },
      {
        q: "How does Min Stack return the minimum in O(1)?",
        options: ["It sorts on every push", "It stores the running minimum next to each pushed value", "It scans the stack on getMin", "It uses a heap"],
        answer: 1,
        why: "The top tuple carries the min of everything beneath it, and popping restores the previous min for free."
      }
    ]
  },

  {
    id: "binary-search",
    track: "Patterns",
    order: 12,
    week: 5,
    title: "Binary search and binary search on the answer",
    minutes: 80,
    goal: "After this lesson you can write a bug-free 'first true' binary search, use it for lower and upper bounds, and apply it to search over possible answers like speed or capacity.",
    why: "Binary search shows up both directly (sorted arrays, rotated arrays) and hidden (minimise the maximum, smallest speed that works). Off-by-one bugs here are the most common reason candidates fail otherwise easy questions.",
    sections: [
      {
        h: "Classic binary search",
        p: [
          "On a sorted array, look at the middle. If it is the target, done. If it is too small, the target can only be on the right; otherwise on the left. Each step halves the range: O(log n).",
          "This version uses a closed range `[lo, hi]` and `while lo <= hi`. It is fine for 'find exact value or return -1'."
        ],
        code: `def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

print(binary_search([-1, 0, 3, 5, 9, 12], 9))
print(binary_search([-1, 0, 3, 5, 9, 12], 2))`,
        out: "4\n-1"
      },
      {
        h: "How to recognise it",
        p: [
          "Signal 1: the input is sorted (or sorted then rotated) and the problem asks for O(log n). Direct binary search.",
          "Signal 2: 'first position', 'last position', 'insert position', 'first bad version'. Think lower bound / first true.",
          "Signal 3: 'minimum speed / capacity / days such that it is possible', 'minimise the largest', 'maximise the smallest'. Binary search on the answer.",
          "Signal 4: you can write a function `can(x)` that says yes/no, and once it says yes for x it says yes for every larger x (monotonic). That is the condition that makes binary search on the answer work.",
          "Signal 5: a 2D matrix where each row continues from the previous one. Treat it as one sorted list using index `mid // cols` and `mid % cols`.",
          "Signal 6: lookup by timestamp 'at or before time t'. Use `bisect` on a sorted list of timestamps."
        ]
      },
      {
        h: "Lower bound: the one template to memorise",
        p: [
          "Lower bound returns the first index where `nums[i] >= target`. Use a half-open range `lo, hi = 0, len(nums)` and `while lo < hi`.",
          "If `nums[mid] >= target`, mid might be the answer, so keep it: `hi = mid`. Otherwise mid is too small: `lo = mid + 1`. The loop ends with `lo == hi` at the answer.",
          "First and Last Position = `lower_bound(target)` and `lower_bound(target + 1) - 1`. Python's `bisect.bisect_left` and `bisect.bisect_right` do the same."
        ],
        code: `import bisect

def lower_bound(nums, target):
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] >= target:
            hi = mid
        else:
            lo = mid + 1
    return lo

nums = [1, 3, 5, 5, 5, 6]
print(lower_bound(nums, 5), lower_bound(nums, 4), lower_bound(nums, 7))
first = lower_bound(nums, 5)
last = lower_bound(nums, 6) - 1
print([first, last])
print(bisect.bisect_left(nums, 5), bisect.bisect_right(nums, 5))`,
        out: "2 2 6\n[2, 4]\n2 5"
      },
      {
        h: "Binary search on the answer",
        p: [
          "Sometimes you are not searching an array, you are searching a range of possible answers. Capacity To Ship Packages: the capacity is at least `max(weights)` (the heaviest package must fit) and at most `sum(weights)` (ship everything in one day).",
          "Write `can(cap)`: greedily load packages in order and count how many days that takes. If a capacity works, every bigger capacity also works. So the answers look like F F F T T T and we want the first T.",
          "Cost: O(n) per check times O(log(range)) checks."
        ],
        code: `def ship_within_days(weights, days):
    def can(cap):
        need, load = 1, 0
        for w in weights:
            if load + w > cap:
                need += 1
                load = 0
            load += w
        return need <= days

    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if can(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo

print(ship_within_days([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5))
print(ship_within_days([3, 2, 2, 4, 1, 4], 3))`,
        out: "15\n6"
      },
      {
        h: "Rotated sorted arrays",
        p: [
          "Find Minimum in Rotated Sorted Array: compare `nums[mid]` with `nums[hi]`. If `nums[mid] > nums[hi]`, the drop (and so the minimum) is to the right of mid. Otherwise the minimum is at mid or to its left.",
          "Search in Rotated Sorted Array: at every step at least one half is normally sorted. Check if the target lies inside the sorted half's range; if yes, search there, else search the other half."
        ],
        code: `def find_min(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        else:
            hi = mid
    return nums[lo]

print(find_min([3, 4, 5, 1, 2]), find_min([11, 13, 15, 17]), find_min([2, 1]))`,
        out: "1 11 1"
      }
    ],
    template: `def first_true(lo, hi, ok):
    # Smallest x in [lo, hi] with ok(x) True.
    # Requires: ok is False...False True...True over the range, and ok(hi) is True.
    while lo < hi:
        mid = (lo + hi) // 2
        if ok(mid):
            hi = mid          # mid works; answer is mid or to its left
        else:
            lo = mid + 1      # mid fails; answer is to its right
    return lo


nums = [2, 4, 4, 7, 9]
print(first_true(0, len(nums), lambda i: i == len(nums) or nums[i] >= 4))   # lower bound of 4
print(first_true(1, 100, lambda x: x * x >= 50))                           # smallest x with x*x >= 50`,
    example: {
      name: "Koko Eating Bananas",
      n: 49,
      steps: [
        "Problem: piles of bananas, h hours. Each hour Koko eats up to k bananas from one pile. Find the minimum integer speed k to finish within h hours.",
        "Signals: 'minimum speed such that it is possible'. If speed k works, any faster speed also works. Monotonic yes/no means binary search on the answer.",
        "Range: k is at least 1 and at most `max(piles)` (at that speed every pile takes one hour, which is the fastest that matters).",
        "Check: hours needed at speed k is the sum of ceil(p / k). In integers, ceil(p / k) = `(p + k - 1) // k`. Feasible if hours <= h.",
        "Dry run on piles = [3, 6, 7, 11], h = 8. lo=1, hi=11.",
        "mid=6: hours = 1+1+2+2 = 6 <= 8, works. hi=6.",
        "mid=3: hours = 1+2+3+4 = 10 > 8, fails. lo=4.",
        "mid=5: hours = 1+2+2+3 = 8, works. hi=5.",
        "mid=4: hours = 1+2+2+3 = 8, works. hi=4. Now lo == hi == 4, answer 4.",
        "Time O(n log max(piles)). Space O(1)."
      ],
      code: `def min_eating_speed(piles, h):
    def hours_needed(k):
        return sum((p + k - 1) // k for p in piles)

    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if hours_needed(mid) <= h:
            hi = mid
        else:
            lo = mid + 1
    return lo

print(min_eating_speed([3, 6, 7, 11], 8))
print(min_eating_speed([30, 11, 23, 4, 20], 5))
print(min_eating_speed([30, 11, 23, 4, 20], 6))`
    },
    mistakes: [
      "Mixing templates: using `while lo <= hi` together with `hi = mid`, which loops forever.",
      "Setting the lower bound of the answer range too low, e.g. capacity starting at 1 instead of `max(weights)`, so `can` gives wrong results.",
      "Using float division `p / k` and `math.ceil` instead of the integer form `(p + k - 1) // k`.",
      "Applying binary search on the answer when the check is not monotonic. Always ask: if x works, does x + 1 work?",
      "In rotated arrays, comparing `nums[mid]` with `nums[lo]` for find-minimum; comparing with `nums[hi]` is the safe choice.",
      "Returning `lo` without checking it is in range when the target may be larger than every element (lower bound can return `len(nums)`)."
    ],
    practice: [45, 46, 47, 48, 49, 50, 51, 52, 53, 54],
    quiz: [
      {
        q: "In the lower bound template, `nums[mid] >= target`. What do you set?",
        options: ["lo = mid + 1", "hi = mid - 1", "hi = mid", "return mid"],
        answer: 2,
        why: "mid might be the first index that satisfies the condition, so keep it inside the range with `hi = mid`."
      },
      {
        q: "What property must `can(x)` have for binary search on the answer?",
        options: ["It must run in O(1)", "Once it is True for x, it is True for every larger x (or the reverse)", "It must use recursion", "x must be an array index"],
        answer: 1,
        why: "Binary search needs a F...F T...T shape so it can throw away half the range each step."
      },
      {
        q: "For Capacity To Ship Packages, what is the correct search range for the capacity?",
        options: ["1 to len(weights)", "min(weights) to max(weights)", "max(weights) to sum(weights)", "0 to days"],
        answer: 2,
        why: "The heaviest package must fit (lower bound), and shipping everything in one day is always enough (upper bound)."
      }
    ]
  },

  {
    id: "linked-list",
    track: "Patterns",
    order: 13,
    week: 5,
    title: "Linked lists: dummy nodes, fast/slow pointers, reversal",
    minutes: 75,
    goal: "After this lesson you can build and print linked lists in Python and solve most list problems with three tools: a dummy head, fast/slow pointers, and in-place reversal.",
    why: "Linked list questions test pointer handling under pressure. Nearly all of them reduce to the same three tools, and LRU Cache (hashmap plus doubly linked list) is a favourite design question for backend roles.",
    sections: [
      {
        h: "Nodes, building and printing",
        p: [
          "A node holds `val` and `next`. The list is just a reference to the first node, the head. `None` marks the end.",
          "On LeetCode the ListNode class is given. Locally, write `build(values)` and `to_list(head)` helpers so you can test quickly.",
          "Walking a list: `cur = head`, then `while cur: ... cur = cur.next`."
        ],
        code: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build(values):
    dummy = ListNode()
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next

def to_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out

head = build([1, 2, 3])
print(to_list(head))
print(head.val, head.next.val, head.next.next.next)`,
        out: "[1, 2, 3]\n1 2 None"
      },
      {
        h: "How to recognise it",
        p: [
          "Signal 1: the head itself might change or be removed (merge, remove nth node, partition). Use a dummy node in front of the head so there is no special case.",
          "Signal 2: 'middle of the list', 'detect a cycle', 'find where the cycle starts'. Use fast/slow pointers: fast moves 2, slow moves 1.",
          "Signal 3: 'nth node from the end' in one pass. Move one pointer n steps ahead, then move both until the leader hits the end.",
          "Signal 4: 'reverse', 'palindrome list', 'reorder', 'reverse in groups of k'. Use the prev/cur reversal loop.",
          "Signal 5: 'copy a list with extra pointers'. Use a dict from old node to new node.",
          "Signal 6: O(1) get and put with eviction of least recently used. Use a hashmap plus a doubly linked list."
        ]
      },
      {
        h: "Dummy node: never special-case the head",
        p: [
          "Create `dummy = ListNode()` and keep a `tail` pointer. Attach nodes to `tail.next` and advance `tail`. At the end return `dummy.next`.",
          "For removal, point a pointer at the node BEFORE the one to delete. With a dummy, even the real head has a node before it."
        ],
        code: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build(values):
    dummy = ListNode()
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next

def to_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out

def merge_two_lists(a, b):
    dummy = ListNode()
    tail = dummy
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b      # attach whatever is left
    return dummy.next

print(to_list(merge_two_lists(build([1, 2, 4]), build([1, 3, 4]))))
print(to_list(merge_two_lists(build([]), build([0]))))`,
        out: "[1, 1, 2, 3, 4, 4]\n[0]"
      },
      {
        h: "Fast and slow pointers",
        p: [
          "Move `slow` one step and `fast` two steps. When fast reaches the end, slow is at the middle (for even length, the second middle).",
          "If there is a cycle, fast laps slow and they meet. If fast hits None, there is no cycle.",
          "Remove Nth From End uses a fixed gap instead: move `fast` n steps first, then move both. When fast is on the last node, slow is just before the node to remove. Start both at a dummy so removing the head works."
        ],
        code: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build(values):
    dummy = ListNode()
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next

def to_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out

def middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow

def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False

def remove_nth_from_end(head, n):
    dummy = ListNode(0, head)
    slow = fast = dummy
    for _ in range(n):
        fast = fast.next
    while fast.next:
        slow = slow.next
        fast = fast.next
    slow.next = slow.next.next
    return dummy.next

print(middle(build([1, 2, 3, 4, 5])).val, middle(build([1, 2, 3, 4])).val)
loop = build([3, 2, 0, -4])
loop.next.next.next.next = loop.next   # tail points back to node 2
print(has_cycle(loop), has_cycle(build([1, 2])))
print(to_list(remove_nth_from_end(build([1, 2, 3, 4, 5]), 2)))
print(to_list(remove_nth_from_end(build([1]), 1)))`,
        out: "3 3\nTrue False\n[1, 2, 3, 5]\n[]"
      },
      {
        h: "In-place reversal",
        p: [
          "Keep `prev = None` and `cur = head`. Each step: save `nxt = cur.next`, point `cur.next = prev`, then move `prev = cur` and `cur = nxt`. When `cur` is None, `prev` is the new head.",
          "Write it the same way every time. Save next first, or you lose the rest of the list."
        ],
        code: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build(values):
    dummy = ListNode()
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next

def to_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out

def reverse(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev

print(to_list(reverse(build([1, 2, 3, 4, 5]))))
print(to_list(reverse(build([]))))`,
        out: "[5, 4, 3, 2, 1]\n[]"
      }
    ],
    template: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def reverse(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next      # 1. save
        cur.next = prev     # 2. flip
        prev, cur = cur, nxt  # 3. advance
    return prev


def middle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    return slow


def build_with_dummy(values):
    dummy = ListNode()      # fake node before the real head
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next       # real head


head = build_with_dummy([1, 2, 3, 4])
print(middle(head).val)
node = reverse(head)
out = []
while node:
    out.append(node.val)
    node = node.next
print(out)`,
    example: {
      name: "Reorder List",
      n: 60,
      steps: [
        "Problem: change L0 -> L1 -> ... -> Ln into L0 -> Ln -> L1 -> Ln-1 -> ... in place.",
        "The new order alternates front and back. Reaching the back from the front is hard in a singly linked list, so reverse the back half. Then it becomes a simple merge of two lists.",
        "Step 1, find the middle with fast/slow. Step 2, cut the list after the middle and reverse the second half. Step 3, merge by alternating one node from each.",
        "Dry run on 1 -> 2 -> 3 -> 4 -> 5.",
        "Middle: slow ends at 3. First half 1 -> 2 -> 3, cut by setting 3.next = None. Second half 4 -> 5.",
        "Reverse second half: 5 -> 4.",
        "Merge: take 1, then 5, then 2, then 4; then first half has 3 left and second half is empty. Result 1 -> 5 -> 2 -> 4 -> 3.",
        "Time O(n), extra space O(1). It combines all three tools from this lesson, which is why interviewers like it."
      ],
      code: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build(values):
    dummy = ListNode()
    tail = dummy
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next

def to_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out

def reorder_list(head):
    if not head or not head.next:
        return
    # 1. find middle
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    # 2. cut and reverse second half
    second = slow.next
    slow.next = None
    prev = None
    while second:
        nxt = second.next
        second.next = prev
        prev = second
        second = nxt
    # 3. merge alternately
    first, second = head, prev
    while second:
        n1, n2 = first.next, second.next
        first.next = second
        second.next = n1
        first, second = n1, n2

for vals in ([1, 2, 3, 4, 5], [1, 2, 3, 4], [1]):
    h = build(vals)
    reorder_list(h)
    print(to_list(h))`
    },
    mistakes: [
      "Overwriting `cur.next` before saving it during reversal, which loses the rest of the list.",
      "Special-casing the head with if/else when a dummy node would remove the case entirely.",
      "Loop condition `while fast.next` without checking `fast` first, which crashes on even-length lists.",
      "Forgetting to cut the first half (`slow.next = None`) in Reorder List or palindrome checks, creating a cycle.",
      "Comparing nodes with `==` on values when you mean identity; use `is` for 'same node'.",
      "Returning `dummy` instead of `dummy.next`."
    ],
    practice: [55, 56, 57, 58, 59, 60, 61, 62, 63, 64],
    quiz: [
      {
        q: "Why use a dummy node when merging two sorted lists?",
        options: ["It makes the code faster", "It gives a fixed node to attach to, so the first real node needs no special case", "Python requires it", "It prevents cycles"],
        answer: 1,
        why: "Without a dummy you must decide the head separately; with it, every node is attached the same way."
      },
      {
        q: "In fast/slow pointers on 1 -> 2 -> 3 -> 4 -> 5, where is slow when the loop ends?",
        options: ["Node 2", "Node 3", "Node 4", "Node 5"],
        answer: 1,
        why: "Fast visits 1, 3, 5 and stops; slow visits 1, 2, 3."
      },
      {
        q: "What is the first line inside the reversal loop?",
        options: ["`cur.next = prev`", "`prev = cur`", "`nxt = cur.next`", "`cur = cur.next`"],
        answer: 2,
        why: "You must save the next node before you overwrite `cur.next`."
      }
    ]
  },

  {
    id: "trees",
    track: "Patterns",
    order: 14,
    week: 6,
    title: "Binary trees: DFS recursion and BFS level order",
    minutes: 90,
    goal: "After this lesson you can solve binary tree problems by deciding what each recursive call returns, and process a tree level by level with a queue.",
    why: "Trees are asked in almost every product-company interview loop. Once you can phrase a problem as 'what does my function return for a subtree', most easy and medium tree questions become a few lines.",
    sections: [
      {
        h: "TreeNode and a builder for testing",
        p: [
          "Each node has `val`, `left`, `right`. LeetCode shows trees as level-order lists like `[3, 9, 20, None, None, 15, 7]` where None is a missing child.",
          "The `build` helper below turns that list into nodes so you can test locally. Copy it into your practice file once and reuse it."
        ],
        code: `from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    q = deque([root])
    i = 1
    while q and i < len(values):
        node = q.popleft()
        if i < len(values) and values[i] is not None:
            node.left = TreeNode(values[i])
            q.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i])
            q.append(node.right)
        i += 1
    return root

root = build([3, 9, 20, None, None, 15, 7])
print(root.val, root.left.val, root.right.val, root.right.left.val)`,
        out: "3 9 20 15"
      },
      {
        h: "How to recognise it",
        p: [
          "Signal 1: 'depth', 'height', 'balanced', 'diameter', 'same tree', 'invert'. DFS where each call returns something about its subtree.",
          "Signal 2: 'level order', 'each level', 'right side view', 'zigzag', 'minimum depth by levels'. BFS with a queue, processing one level at a time.",
          "Signal 3: 'path from root', 'good nodes', 'path sum'. DFS that passes information DOWN as parameters (running max, running sum, current path).",
          "Signal 4: the answer can pass through a node without going through the root (diameter, max path sum). DFS that returns one thing (height) but updates a global answer with another (left + right).",
          "Signal 5: 'lowest common ancestor'. Post-order DFS: each call reports whether it found p or q below it.",
          "Rule of thumb: first write the base case for `None`, then assume the recursive calls on children already work, and combine their results."
        ]
      },
      {
        h: "DFS recursion: return something from each subtree",
        p: [
          "Max depth of a tree = 1 + max(depth of left, depth of right). Depth of None is 0. That sentence is the whole code.",
          "Invert tree: swap the children, then invert each child. Same tree: both None, or same value and both subtrees the same.",
          "Each node is visited once: O(n) time, O(h) space for the call stack where h is the height."
        ],
        code: `from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    q = deque([root])
    i = 1
    while q and i < len(values):
        node = q.popleft()
        if i < len(values) and values[i] is not None:
            node.left = TreeNode(values[i])
            q.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i])
            q.append(node.right)
        i += 1
    return root

def max_depth(root):
    if not root:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))

def invert(root):
    if not root:
        return None
    root.left, root.right = invert(root.right), invert(root.left)
    return root

def same_tree(a, b):
    if not a and not b:
        return True
    if not a or not b or a.val != b.val:
        return False
    return same_tree(a.left, b.left) and same_tree(a.right, b.right)

t = build([3, 9, 20, None, None, 15, 7])
print(max_depth(t))
inv = invert(build([4, 2, 7, 1, 3, 6, 9]))
print(inv.val, inv.left.val, inv.right.val, inv.left.left.val)
print(same_tree(build([1, 2, 3]), build([1, 2, 3])), same_tree(build([1, 2]), build([1, None, 2])))`,
        out: "3\n4 7 2 9\nTrue False"
      },
      {
        h: "BFS level order with a queue",
        p: [
          "Put the root in a `deque`. While the queue is not empty, read `len(q)` FIRST: that is how many nodes are on the current level. Pop exactly that many, collect their values, and push their children.",
          "Right Side View is the same loop: keep only the last value of each level."
        ],
        code: `from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    q = deque([root])
    i = 1
    while q and i < len(values):
        node = q.popleft()
        if i < len(values) and values[i] is not None:
            node.left = TreeNode(values[i])
            q.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i])
            q.append(node.right)
        i += 1
    return root

def level_order(root):
    if not root:
        return []
    res = []
    q = deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        res.append(level)
    return res

levels = level_order(build([3, 9, 20, None, None, 15, 7]))
print(levels)
print([lvl[-1] for lvl in levels])   # right side view`,
        out: "[[3], [9, 20], [15, 7]]\n[3, 20, 7]"
      },
      {
        h: "Passing information down, and finding LCA",
        p: [
          "Count Good Nodes: a node is good if no node on the path from the root is bigger. Pass the running max down as a parameter; each call returns the count in its subtree.",
          "Lowest Common Ancestor (general binary tree): each call returns p or q if it found one below it, else None. If both left and right return something, the current node is the LCA. Otherwise pass up whichever side is not None.",
          "Path Sum II passes the current path down and removes the last node after the recursive calls return (backtracking)."
        ],
        code: `from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    q = deque([root])
    i = 1
    while q and i < len(values):
        node = q.popleft()
        if i < len(values) and values[i] is not None:
            node.left = TreeNode(values[i])
            q.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i])
            q.append(node.right)
        i += 1
    return root

def good_nodes(root, best=float("-inf")):
    if not root:
        return 0
    good = 1 if root.val >= best else 0
    best = max(best, root.val)
    return good + good_nodes(root.left, best) + good_nodes(root.right, best)

def lca(root, p, q):
    if not root or root is p or root is q:
        return root
    left = lca(root.left, p, q)
    right = lca(root.right, p, q)
    if left and right:
        return root
    return left or right

print(good_nodes(build([3, 1, 4, 3, None, 1, 5])))
t = build([3, 5, 1, 6, 2, 0, 8])
print(lca(t, t.left, t.right).val, lca(t, t.left, t.left.right).val)`,
        out: "4\n3 5"
      }
    ],
    template: `from collections import deque


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def dfs(node):
    if not node:                 # 1. base case
        return 0
    left = dfs(node.left)        # 2. trust the children
    right = dfs(node.right)
    return 1 + max(left, right)  # 3. combine (this one computes height)


def bfs(root):
    if not root:
        return []
    res, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):  # fix the level size before popping
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        res.append(level)
    return res


root = TreeNode(1, TreeNode(2, TreeNode(4)), TreeNode(3))
print(dfs(root))
print(bfs(root))`,
    example: {
      name: "Diameter of Binary Tree",
      n: 69,
      steps: [
        "Problem: the diameter is the number of EDGES on the longest path between any two nodes. The path does not have to pass through the root.",
        "Any path has a highest node. Through that node, the path length is height(left) + height(right), where height counts nodes down to a leaf.",
        "So write `height(node)` that returns 1 + max(left, right), and while computing it, update a global `best = max(best, left + right)`. The function returns one thing (height) but records another (diameter). This 'return one, update global' shape is the key idea.",
        "Dry run on [1, 2, 3, 4, 5]: node 1 has children 2 and 3; node 2 has children 4 and 5.",
        "height(4): children are 0 and 0, best = max(0, 0) = 0, returns 1. height(5) also returns 1.",
        "height(2): left 1, right 1, best = max(0, 2) = 2, returns 2.",
        "height(3): leaf, returns 1, best stays 2.",
        "height(1): left 2, right 1, best = max(2, 3) = 3, returns 3.",
        "Answer 3 (path 4 -> 2 -> 1 -> 3). O(n) time, O(h) stack space."
      ],
      code: `from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    q = deque([root])
    i = 1
    while q and i < len(values):
        node = q.popleft()
        if i < len(values) and values[i] is not None:
            node.left = TreeNode(values[i])
            q.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i])
            q.append(node.right)
        i += 1
    return root

def diameter_of_binary_tree(root):
    best = 0

    def height(node):
        nonlocal best
        if not node:
            return 0
        left = height(node.left)
        right = height(node.right)
        best = max(best, left + right)
        return 1 + max(left, right)

    height(root)
    return best

print(diameter_of_binary_tree(build([1, 2, 3, 4, 5])))
print(diameter_of_binary_tree(build([1, 2])))
print(diameter_of_binary_tree(build([1, 2, None, 3, 4, 5, None, None, 6])))`
    },
    mistakes: [
      "Forgetting the `if not node` base case, which crashes with AttributeError on None.",
      "Assigning to an outer variable inside a nested function without `nonlocal`, which raises UnboundLocalError.",
      "In BFS, calling `len(q)` inside the inner loop condition after pushing children, which mixes levels. Read the level size once per level.",
      "Using `list.pop(0)` as a queue, which is O(n) per pop. Use `collections.deque` and `popleft()`.",
      "Counting nodes instead of edges in diameter (or the reverse). Read what the problem counts.",
      "Deep recursion on a skewed tree of 10^5 nodes can hit Python's recursion limit; mention an iterative version or `sys.setrecursionlimit` in interviews."
    ],
    practice: [65, 66, 67, 68, 69, 70, 71, 72, 76, 78, 79, 77, 80],
    quiz: [
      {
        q: "Which traversal fits 'return the values on each level as separate lists'?",
        options: ["Preorder DFS", "BFS with a queue, reading len(q) per level", "Inorder DFS", "Binary search"],
        answer: 1,
        why: "BFS naturally visits nodes level by level, and fixing `len(q)` at the start of each level separates them."
      },
      {
        q: "In Diameter of Binary Tree, what does the helper return, and what does it update?",
        options: ["Returns diameter, updates height", "Returns height, updates the global best with left + right", "Returns node count, updates depth", "Returns True/False, updates a list"],
        answer: 1,
        why: "The parent needs heights to continue; the diameter through each node is recorded on the side."
      },
      {
        q: "In Count Good Nodes, how does each call know the maximum value on the path from the root?",
        options: ["It recomputes the path every time", "It is passed down as a parameter", "It is stored in each node", "It uses BFS"],
        answer: 1,
        why: "Information from ancestors travels down through function arguments."
      }
    ]
  },

  {
    id: "bst",
    track: "Patterns",
    order: 15,
    week: 7,
    title: "Binary search trees",
    minutes: 60,
    goal: "After this lesson you can use the BST ordering rule to search, find the LCA, validate a tree with bounds, and get sorted order with an inorder traversal.",
    why: "BST questions check whether you use the ordering property instead of treating the tree as a generic tree. Validate BST in particular has a classic trap that interviewers use to filter candidates.",
    sections: [
      {
        h: "The BST rule and what it buys you",
        p: [
          "In a binary search tree, EVERY value in a node's left subtree is smaller than the node, and EVERY value in its right subtree is larger. Not just the direct children: the whole subtree.",
          "So searching works like binary search: compare with the current node and go left or right. Time is O(h), the height. That is O(log n) for a balanced tree and O(n) for a skewed one."
        ],
        code: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def insert(root, val):
    if not root:
        return TreeNode(val)
    if val < root.val:
        root.left = insert(root.left, val)
    else:
        root.right = insert(root.right, val)
    return root

def search(root, val):
    while root and root.val != val:
        root = root.left if val < root.val else root.right
    return root

root = None
for v in [8, 3, 10, 1, 6, 14]:
    root = insert(root, v)
print(search(root, 6) is not None, search(root, 7) is not None)`,
        out: "True False"
      },
      {
        h: "How to recognise it",
        p: [
          "Signal 1: the problem says 'binary search tree' or 'BST'. Ask yourself how the ordering rule lets you skip half the tree.",
          "Signal 2: 'kth smallest', 'sorted order', 'successor', 'two values closest to'. Inorder traversal (left, node, right) visits a BST in sorted order.",
          "Signal 3: 'is this a valid BST'. Pass allowed bounds (low, high) down the recursion, or check that the inorder sequence is strictly increasing.",
          "Signal 4: 'lowest common ancestor in a BST'. If both values are smaller, go left; both larger, go right; otherwise the current node splits them and is the LCA.",
          "If the tree is a plain binary tree (no ordering), these shortcuts do not apply; use the general DFS from the trees lesson."
        ]
      },
      {
        h: "Inorder gives sorted order: Kth Smallest",
        p: [
          "Inorder visits left subtree, then node, then right subtree. For a BST that is ascending order.",
          "Kth Smallest: do an iterative inorder with a stack and stop at the kth node popped. Go left as far as possible, pop, count, then move to the right child."
        ],
        code: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def insert(root, val):
    if not root:
        return TreeNode(val)
    if val < root.val:
        root.left = insert(root.left, val)
    else:
        root.right = insert(root.right, val)
    return root

def kth_smallest(root, k):
    stack = []
    cur = root
    while stack or cur:
        while cur:
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()
        k -= 1
        if k == 0:
            return cur.val
        cur = cur.right

root = None
for v in [5, 3, 6, 2, 4, 1]:
    root = insert(root, v)
print(kth_smallest(root, 1), kth_smallest(root, 3), kth_smallest(root, 6))`,
        out: "1 3 6"
      },
      {
        h: "LCA in a BST: follow the split",
        p: [
          "Start at the root. If both p and q are smaller than the node, the LCA is in the left subtree. If both are larger, it is in the right subtree. Otherwise they split here (or one of them is this node), so this node is the LCA.",
          "No recursion over the whole tree is needed: O(h) time, O(1) space."
        ],
        code: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def insert(root, val):
    if not root:
        return TreeNode(val)
    if val < root.val:
        root.left = insert(root.left, val)
    else:
        root.right = insert(root.right, val)
    return root

def lca_bst(root, p, q):
    cur = root
    while cur:
        if p < cur.val and q < cur.val:
            cur = cur.left
        elif p > cur.val and q > cur.val:
            cur = cur.right
        else:
            return cur

root = None
for v in [6, 2, 8, 0, 4, 7, 9, 3, 5]:
    root = insert(root, v)
print(lca_bst(root, 2, 8).val, lca_bst(root, 2, 4).val, lca_bst(root, 3, 5).val)`,
        out: "6 2 4"
      }
    ],
    template: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def check_with_bounds(node, low=float("-inf"), high=float("inf")):
    if not node:
        return True
    if not (low < node.val < high):          # node must fit its allowed range
        return False
    return (check_with_bounds(node.left, low, node.val) and      # left: tighten high
            check_with_bounds(node.right, node.val, high))       # right: tighten low


def inorder(node, out):
    if node:
        inorder(node.left, out)
        out.append(node.val)                 # sorted order for a BST
        inorder(node.right, out)
    return out


root = TreeNode(4, TreeNode(2, TreeNode(1), TreeNode(3)), TreeNode(6))
print(check_with_bounds(root))
print(inorder(root, []))`,
    example: {
      name: "Validate Binary Search Tree",
      n: 74,
      steps: [
        "Problem: return True if the tree is a valid BST (strictly smaller on the left, strictly larger on the right, for whole subtrees).",
        "Trap: checking only `node.left.val < node.val < node.right.val` is wrong. A deep node can break the rule against an ancestor.",
        "Fix: every node has an allowed open interval (low, high). The root gets (-inf, inf). Going left, the upper bound becomes the parent's value. Going right, the lower bound becomes the parent's value.",
        "Dry run on [5, 4, 6, None, None, 3, 7]: 5 has children 4 and 6; 6 has children 3 and 7.",
        "Node 5 in (-inf, inf): ok. Node 4 in (-inf, 5): ok, no children.",
        "Node 6 in (5, inf): ok. Its left child 3 must be in (5, 6). 3 is not greater than 5, so return False.",
        "The naive parent-child check would say 3 < 6 is fine and wrongly return True. Bounds catch it.",
        "Time O(n), space O(h). Alternative: inorder traversal must be strictly increasing."
      ],
      code: `from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    q = deque([root])
    i = 1
    while q and i < len(values):
        node = q.popleft()
        if i < len(values) and values[i] is not None:
            node.left = TreeNode(values[i])
            q.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i])
            q.append(node.right)
        i += 1
    return root

def is_valid_bst(root):
    def check(node, low, high):
        if not node:
            return True
        if not (low < node.val < high):
            return False
        return check(node.left, low, node.val) and check(node.right, node.val, high)

    return check(root, float("-inf"), float("inf"))

print(is_valid_bst(build([2, 1, 3])))
print(is_valid_bst(build([5, 1, 4, None, None, 3, 6])))
print(is_valid_bst(build([5, 4, 6, None, None, 3, 7])))
print(is_valid_bst(build([2, 2, 2])))`
    },
    mistakes: [
      "Validating only parent and direct children instead of passing bounds for the whole subtree.",
      "Using `<=` in the bounds check, which accepts duplicates when the problem wants strict ordering.",
      "Starting bounds at 0 or a fixed number like 10**9 instead of `float(\"-inf\")` and `float(\"inf\")`.",
      "Doing a full DFS for LCA in a BST instead of following the split, which is slower and misses the point of the question.",
      "Forgetting that BST operations are O(h), which is O(n) for a skewed tree, when stating complexity."
    ],
    practice: [73, 74, 75],
    quiz: [
      {
        q: "Which traversal of a BST gives values in ascending order?",
        options: ["Preorder", "Inorder", "Postorder", "Level order"],
        answer: 1,
        why: "Inorder visits left (smaller), node, right (larger)."
      },
      {
        q: "Tree: 5 with left 4 and right 6; 6 has left child 3. Is it a valid BST?",
        options: ["Yes, every parent-child pair is in order", "No, 3 is in the right subtree of 5 but is smaller than 5", "Yes, because inorder starts with 4", "No, because 6 has only one child"],
        answer: 1,
        why: "The rule applies to whole subtrees. Bounds for node 3 are (5, 6), and 3 is outside them."
      },
      {
        q: "In LCA of a BST, p = 2 and q = 8 and the current node is 6. What do you do?",
        options: ["Go left", "Go right", "Return 6", "Search both subtrees"],
        answer: 2,
        why: "One value is smaller and one is larger, so they split at 6, which makes 6 the LCA."
      }
    ]
  }
);
