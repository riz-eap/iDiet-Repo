

import numpy as np
import csv
import json
import math
import random
from collections import defaultdict
from typing import List, Dict, Tuple

# ---------------------------
# Configurable parameters
# ---------------------------
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)
random.seed(RANDOM_SEED)

NUM_EXERCISES = 1200    # generate this many exercise entries
NUM_DIETS = 1200        # generate this many diet plans
NUM_SYN_USERS = 5000    # number of synthetic users for training data
TRAIN_TEST_SPLIT = 0.8

# Goals / labels
GOALS = ['lose_weight', 'gain_muscle', 'maintain_weight', 'improve_endurance', 'general_health']

# Activity levels (0-4)
ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active']

# Diet preferences
DIET_PREFERENCES = ['omnivore', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'low_carb', 'high_protein']

# Exercise types and muscle groups library
EXERCISE_TYPES = ['cardio', 'strength', 'flexibility', 'balance', 'hiit', 'plyometrics']
MUSCLE_GROUPS = ['full_body', 'upper_body', 'lower_body', 'core', 'glutes', 'back', 'legs', 'chest', 'arms', 'shoulders']

# ---------------------------
# Utilities & Generators
# ---------------------------
def generate_exercises(n: int) -> List[Dict]:
    """
    Generate n synthetic, but realistic, exercises.
    Each exercise has:
      - id
      - name
      - type (cardio/strength/...)
      - primary_muscle
      - difficulty (1-5)
      - estimated_cal_burn_per_30m (int)
      - equipment (None or list)
      - duration_minutes (typical session duration)
    """
    exercises = []
    base_cardio = [
        ("Treadmill Run", "cardio", "full_body"),
        ("Cycling (Indoor)", "cardio", "legs"),
        ("Rowing Machine", "cardio", "back"),
        ("Jump Rope", "cardio", "full_body"),
    ]
    base_strength = [
        ("Push-ups", "strength", "chest"),
        ("Squats", "strength", "glutes"),
        ("Deadlift", "strength", "back"),
        ("Dumbbell Curl", "strength", "arms"),
    ]

    # Helpful adjectives and variations to expand list
    mods = ["Basic", "Advanced", "Beginner", "Power", "Slow", "Explosive", "Weighted", "Bodyweight", "Assisted", "Stability"]
    equipments = [None, "Dumbbells", "Barbell", "Kettlebell", "Resistance Band", "Machine", "None", "Mat"]

    idx = 1
    # seed base entries
    base = base_cardio + base_strength
    for name, ex_type, muscle in base:
        ex = {
            "id": f"EX{idx:05d}",
            "name": name,
            "type": ex_type,
            "muscle": muscle,
            "difficulty": random.randint(1, 5),
            "cal30": random.randint(180, 450) if ex_type == "cardio" else random.randint(100, 300),
            "equipment": random.choice(equipments),
            "duration": random.choice([10, 15, 20, 30, 45]),
            "description": f"{name} focusing on {muscle}"
        }
        exercises.append(ex)
        idx += 1

    # generate many variations
    while idx <= n:
        base_name = random.choice(base)[0]
        mod = random.choice(mods)
        name = f"{mod} {base_name}"
        ex_type = random.choice(EXERCISE_TYPES)
        muscle = random.choice(MUSCLE_GROUPS)
        difficulty = int(np.clip(np.random.normal(3, 1), 1, 5))
        # heuristics for cal burn
        if ex_type == "cardio":
            cal30 = int(np.clip(np.random.normal(300, 60), 120, 700))
            duration = random.choice([10, 15, 20, 25, 30, 40])
        elif ex_type == "hiit" or ex_type == "plyometrics":
            cal30 = int(np.clip(np.random.normal(360, 80), 150, 800))
            duration = random.choice([10, 15, 20])
        else:
            cal30 = int(np.clip(np.random.normal(180, 50), 60, 400))
            duration = random.choice([10, 15, 20, 30, 45])
        equipment = random.choice(equipments)
        ex = {
            "id": f"EX{idx:05d}",
            "name": name,
            "type": ex_type,
            "muscle": muscle,
            "difficulty": difficulty,
            "cal30": cal30,
            "equipment": equipment,
            "duration": duration,
            "description": f"{name} - {ex_type} targeting {muscle}"
        }
        exercises.append(ex)
        idx += 1
    return exercises

def generate_diets(n: int) -> List[Dict]:
    """
    Generate n synthetic diet plans.
    Each diet has:
      - id
      - name
      - preference (veg/vegan/keto/etc.)
      - calories_per_day (int)
      - protein_g, carbs_g, fat_g
      - meals (list of strings e.g., 'Breakfast: ...')
      - description
    """
    diets = []
    idx = 1
    # base templates
    meal_bases = {
        'omnivore': ["Omelette & toast", "Chicken salad", "Salmon & quinoa", "Greek yogurt & nuts"],
        'vegetarian': ["Oats & fruit", "Paneer salad", "Lentil stew", "Yogurt & berries"],
        'vegan': ["Tofu scramble", "Quinoa salad", "Chickpea curry", "Almond milk smoothie"],
        'keto': ["Eggs & avocado", "Grilled chicken & greens", "Salmon with butter", "Cheese & nuts"],
        'paleo': ["Eggs & veggies", "Steak & salad", "Baked fish & veggies", "Nuts & fruit"],
        'mediterranean': ["Olive oil salad", "Hummus & veggies", "Grilled fish & veggies", "Greek yogurt"],
        'low_carb': ["Eggs & bacon", "Chicken & salad", "Tuna salad", "Nuts & cheese"],
        'high_protein': ["Protein shake", "Chicken & rice", "Egg whites & spinach", "Cottage cheese & fruit"],
    }

    prefs = list(meal_bases.keys())

    while idx <= n:
        pref = random.choice(prefs)
        name = f"{pref.capitalize()} Plan {idx}"
        # calories depends on goal but when generating diets keep variety
        cal = int(np.clip(np.random.normal(2000, 350), 1200, 3500))
        # macros rough percentages by preference guess
        if pref in ('keto', 'low_carb'):
            protein = int(cal * 0.25 / 4)
            fat = int(cal * 0.60 / 9)
            carbs = int((cal - (protein*4 + fat*9)) / 4)
        elif pref in ('high_protein',):
            protein = int(cal * 0.35 / 4)
            carbs = int(cal * 0.40 / 4)
            fat = int((cal - (protein*4 + carbs*4)) / 9)
        else:
            protein = int(cal * 0.2 / 4)
            carbs = int(cal * 0.5 / 4)
            fat = int((cal - (protein*4 + carbs*4)) / 9)

        meals = []
        base_meals = meal_bases[pref]
        # produce 3-5 meals by rotating
        num_meals = random.choice([3, 4])
        for i in range(num_meals):
            meals.append(f"Meal {i+1}: {random.choice(base_meals)}")
        diet = {
            "id": f"DI{idx:05d}",
            "name": name,
            "preference": pref,
            "calories": cal,
            "protein_g": max(10, protein),
            "carbs_g": max(5, carbs),
            "fat_g": max(5, fat),
            "meals": meals,
            "description": f"{name} - {pref} style with approx {cal} kcal/day"
        }
        diets.append(diet)
        idx += 1
    return diets

# ---------------------------
# Synthetic user generator and labeling heuristic
# ---------------------------
def body_mass_index(weight_kg: float, height_cm: float) -> float:
    height_m = height_cm / 100.0
    if height_m <= 0:
        return 0.0
    return weight_kg / (height_m ** 2)

def generate_synthetic_users(n: int) -> List[Dict]:
    """
    Generate synthetic users with features:
     - id, age, sex, height_cm, weight_kg, bmi, activity_level, diet_pref, goal (label)
     - baseline_strength, baseline_endurance (scores 0-100)
    Labels (goal) computed heuristically:
     - If BMI > 27 -> likely lose_weight
     - If BMI < 20 and low muscle -> gain_muscle
     - If endurance high -> improve_endurance
     - else random assignment among maintain / general_health
    """
    users = []
    for i in range(1, n+1):
        age = int(np.clip(np.random.normal(30, 8), 16, 75))
        sex = random.choice(['male', 'female', 'other'])
        height = int(np.clip(np.random.normal(170 if sex=='male' else 160, 10), 140, 210))
        weight = float(np.clip(np.random.normal(75 if sex=='male' else 65, 18), 40, 180))
        bmi = body_mass_index(weight, height)
        activity_level = random.choice(ACTIVITY_LEVELS)
        diet_pref = random.choice(DIET_PREFERENCES)
        strength = int(np.clip(np.random.normal(50 if activity_level in ('moderate','active') else 40, 15), 5, 100))
        endurance = int(np.clip(np.random.normal(50 if activity_level in ('active','very_active') else 35, 15), 5, 100))

        # Labeling heuristic
        if bmi >= 27:
            goal = 'lose_weight'
        elif bmi < 20 and strength < 45:
            goal = 'gain_muscle'
        elif endurance >= 70:
            goal = 'improve_endurance'
        else:
            goal = random.choice(['maintain_weight', 'general_health'])

        users.append({
            "id": f"U{i:06d}",
            "age": age,
            "sex": sex,
            "height_cm": height,
            "weight_kg": weight,
            "bmi": round(bmi, 2),
            "activity_level": activity_level,
            "diet_pref": diet_pref,
            "strength": strength,
            "endurance": endurance,
            "goal": goal
        })
    return users

# ---------------------------
# Feature encoding (pure numpy)
# ---------------------------
def one_hot_encode_index(value, choices):
    arr = np.zeros(len(choices), dtype=np.float32)
    idx = choices.index(value) if value in choices else None
    if idx is not None:
        arr[idx] = 1.0
    return arr

def prepare_feature_matrix(users: List[Dict]) -> Tuple[np.ndarray, List[str]]:
    """
    Convert user dicts into numeric numpy feature matrix X and label list y_str
    Features:
      - age (scaled)
      - height_cm (scaled)
      - weight_kg (scaled)
      - bmi (scaled)
      - activity_level (one-hot)
      - diet_pref (one-hot)
      - strength (scaled)
      - endurance (scaled)
    """
    n = len(users)
    act_size = len(ACTIVITY_LEVELS)
    diet_size = len(DIET_PREFERENCES)
    feature_dim = 4 + act_size + diet_size + 2  # age,height,weight,bmi + activity OH + diet OH + strength,endurance
    X = np.zeros((n, feature_dim), dtype=np.float32)
    y = []
    for i, u in enumerate(users):
        # continuous scaled roughly to 0-1
        age = (u['age'] - 16) / (75 - 16)
        height = (u['height_cm'] - 140) / (210 - 140)
        weight = (u['weight_kg'] - 40) / (180 - 40)
        bmi = (u['bmi'] - 15) / (40 - 15)
        idx = 0
        X[i, idx] = age; idx += 1
        X[i, idx] = height; idx += 1
        X[i, idx] = weight; idx += 1
        X[i, idx] = bmi; idx += 1
        # activity one-hot
        act_oh = one_hot_encode_index(u['activity_level'], ACTIVITY_LEVELS)
        X[i, idx:idx+act_size] = act_oh; idx += act_size
        # diet one-hot
        diet_oh = one_hot_encode_index(u['diet_pref'], DIET_PREFERENCES)
        X[i, idx:idx+diet_size] = diet_oh; idx += diet_size
        # strength / endurance scaled
        X[i, idx] = u['strength'] / 100.0; idx += 1
        X[i, idx] = u['endurance'] / 100.0; idx += 1

        y.append(u['goal'])
    return X, y

def label_to_idx(labels: List[str]) -> Tuple[np.ndarray, Dict[str, int], Dict[int, str]]:
    unique = sorted(list(set(labels)))
    label_map = {l: i for i, l in enumerate(unique)}
    inv_map = {i: l for l, i in label_map.items()}
    y_idx = np.array([label_map[l] for l in labels], dtype=np.int32)
    return y_idx, label_map, inv_map

# ---------------------------
# Simple NumPy neural network (2-layer) with softmax output
# ---------------------------
class SimpleNN:
    def __init__(self, in_dim: int, hidden_dim: int, out_dim: int):
        # He initialization
        self.W1 = np.random.randn(in_dim, hidden_dim) * np.sqrt(2.0 / max(1, in_dim))
        self.b1 = np.zeros((hidden_dim,))
        self.W2 = np.random.randn(hidden_dim, out_dim) * np.sqrt(2.0 / max(1, hidden_dim))
        self.b2 = np.zeros((out_dim,))
        # For simple momentum or AdaGrad later - keep accumulators
        self.grads = {}

    @staticmethod
    def relu(x):
        return np.maximum(0, x)

    @staticmethod
    def relu_deriv(x):
        return (x > 0).astype(np.float32)

    @staticmethod
    def softmax(z):
        z = z - np.max(z, axis=1, keepdims=True)
        expz = np.exp(z)
        return expz / np.sum(expz, axis=1, keepdims=True)

    @staticmethod
    def cross_entropy(preds, targets):
        # preds shape (n, C) probability; targets shape (n,) ints
        n = preds.shape[0]
        # clip to avoid log(0)
        clipped = np.clip(preds[np.arange(n), targets], 1e-12, 1.0)
        loss = -np.mean(np.log(clipped))
        return loss

    def forward(self, X):
        z1 = X.dot(self.W1) + self.b1  # (n, hidden)
        a1 = self.relu(z1)
        z2 = a1.dot(self.W2) + self.b2
        probs = self.softmax(z2)
        cache = {'X': X, 'z1': z1, 'a1': a1, 'z2': z2, 'probs': probs}
        return probs, cache

    def backward(self, cache, targets):
        X = cache['X']
        a1 = cache['a1']
        probs = cache['probs']
        n = X.shape[0]
        # gradient of loss wrt z2
        dZ2 = probs.copy()
        dZ2[np.arange(n), targets] -= 1
        dZ2 /= n
        dW2 = a1.T.dot(dZ2)
        db2 = dZ2.sum(axis=0)
        da1 = dZ2.dot(self.W2.T)
        dz1 = da1 * self.relu_deriv(cache['z1'])
        dW1 = X.T.dot(dz1)
        db1 = dz1.sum(axis=0)
        return dW1, db1, dW2, db2

    def step(self, grads, lr=0.01, weight_decay=0.0):
        dW1, db1, dW2, db2 = grads
        # optionally L2 regularization applied directly
        self.W1 -= lr * (dW1 + weight_decay * self.W1)
        self.b1 -= lr * db1
        self.W2 -= lr * (dW2 + weight_decay * self.W2)
        self.b2 -= lr * db2

    def predict(self, X):
        probs, _ = self.forward(X)
        return np.argmax(probs, axis=1)

# ---------------------------
# Training loop
# ---------------------------
def train_model(X_train: np.ndarray, y_train: np.ndarray, X_val=None, y_val=None,
                hidden_dim=64, epochs=50, batch_size=64, lr=0.05, weight_decay=1e-4):
    in_dim = X_train.shape[1]
    out_dim = int(np.max(y_train) + 1)
    model = SimpleNN(in_dim, hidden_dim, out_dim)
    n = X_train.shape[0]
    for epoch in range(1, epochs+1):
        # shuffle
        perm = np.random.permutation(n)
        X_sh = X_train[perm]
        y_sh = y_train[perm]
        losses = []
        for i in range(0, n, batch_size):
            Xb = X_sh[i:i+batch_size]
            yb = y_sh[i:i+batch_size]
            probs, cache = model.forward(Xb)
            loss = SimpleNN.cross_entropy(probs, yb)
            grads = model.backward(cache, yb)
            model.step(grads, lr=lr, weight_decay=weight_decay)
            losses.append(loss)
        avg_loss = float(np.mean(losses))
        if epoch % max(1, epochs // 10) == 0 or epoch == 1:
            preds_train = model.predict(X_train)
            acc_train = float(np.mean(preds_train == y_train))
            msg = f"Epoch {epoch}/{epochs} - loss {avg_loss:.4f} - train_acc {acc_train:.4f}"
            if X_val is not None and y_val is not None:
                preds_val = model.predict(X_val)
                acc_val = float(np.mean(preds_val == y_val))
                msg += f" - val_acc {acc_val:.4f}"
            print(msg)
    return model

# ---------------------------
# Recommendation logic
# ---------------------------
def score_exercise_for_goal(ex: Dict, goal: str) -> float:
    """
    Heuristic scoring: give a quick score of how well an exercise matches a goal.
    """
    score = 0.0
    if goal == 'lose_weight':
        # cardio & hiit higher, higher cal burn
        if ex['type'] in ('cardio', 'hiit', 'plyometrics'):
            score += 2.0
        score += ex['cal30'] / 300.0
    elif goal == 'gain_muscle':
        if ex['type'] == 'strength':
            score += 2.0
        if ex['muscle'] in ('full_body', 'upper_body', 'glutes', 'legs'):
            score += 0.5
        score += (ex['difficulty'] / 5.0)
    elif goal == 'improve_endurance':
        if ex['type'] in ('cardio', 'hiit', 'plyometrics'):
            score += 1.5
        score += ex['duration'] / 30.0
    elif goal == 'maintain_weight':
        score += 1.0
        if ex['type'] in ('cardio', 'strength'):
            score += 0.5
    else:
        score += 0.5
    # small randomization to diversify recommendations
    score += random.random() * 0.1
    return score

def score_diet_for_goal(diet: Dict, goal: str, user: Dict) -> float:
    """
    Basic heuristic for diet fitness goal compatibility:
    - For lose_weight: lower calories (relative to user)
    - For gain_muscle: high protein
    - For maintain: balanced
    - For endurance: carbs presence
    """
    score = 0.0
    cal = diet['calories']
    prot = diet['protein_g']
    carbs = diet['carbs_g']
    pref_ok = (diet['preference'] == user['diet_pref'])
    if pref_ok:
        score += 0.8
    # heuristics based on goal
    if goal == 'lose_weight':
        score += max(0, (2800 - cal) / 1500)  # lower cal => higher score
    elif goal == 'gain_muscle':
        score += prot / 150.0
        score += cal / 3500.0
    elif goal == 'improve_endurance':
        score += carbs / 300.0
    elif goal == 'maintain_weight':
        score += 0.5 * (1 - abs(cal - 2500) / 2000.0)
    else:
        score += 0.2
    score += random.random() * 0.05
    return score

def recommend_for_user(user: Dict, model: SimpleNN, inv_label_map: Dict[int, str],
                       exercises: List[Dict], diets: List[Dict], top_k_ex=8, top_k_diet=3):
    """
    Predict user's goal and then recommend exercises and diets.
    """
    # Prepare single feature row
    X_row, _ = prepare_feature_matrix([user])
    pred_idx = model.predict(X_row)[0]
    pred_goal = inv_label_map[pred_idx]
    # score exercises
    scored_ex = [(score_exercise_for_goal(e, pred_goal), e) for e in exercises]
    scored_ex.sort(key=lambda x: x[0], reverse=True)
    top_ex = [e for s,e in scored_ex[:top_k_ex]]
    # score diets
    scored_di = [(score_diet_for_goal(d, pred_goal, user), d) for d in diets]
    scored_di.sort(key=lambda x: x[0], reverse=True)
    top_di = [d for s,d in scored_di[:top_k_diet]]
    return {
        "predicted_goal": pred_goal,
        "top_exercises": top_ex,
        "top_diets": top_di
    }

# ---------------------------
# Export helpers
# ---------------------------
def export_to_csv_items(items: List[Dict], filename: str, fields: List[str] = None):
    if not items:
        print("No items to export.")
        return
    if fields is None:
        # union of keys
        keys = set()
        for it in items:
            keys.update(it.keys())
        fields = sorted(list(keys))
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for it in items:
            row = {k: json.dumps(it[k]) if isinstance(it[k], (list, dict)) else it.get(k, "") for k in fields}
            writer.writerow(row)
    print(f"Exported {len(items)} items to {filename}")

# ---------------------------
# Build dataset, train, and demo
# ---------------------------
def build_and_train_demo():
    print("Generating exercises and diets...")
    exercises = generate_exercises(NUM_EXERCISES)
    diets = generate_diets(NUM_DIETS)
    print(f"Generated {len(exercises)} exercises and {len(diets)} diets.")

    print("Generating synthetic users...")
    users = generate_synthetic_users(NUM_SYN_USERS)
    print(f"Generated {len(users)} synthetic users.")

    print("Preparing feature matrix...")
    X, y_str = prepare_feature_matrix(users)
    y_idx, label_map, inv_map = label_to_idx(y_str)
    print("Labels found:", label_map)

    # train/test split
    n = X.shape[0]
    split = int(n * TRAIN_TEST_SPLIT)
    perm = np.random.permutation(n)
    train_idx = perm[:split]
    test_idx = perm[split:]
    X_train = X[train_idx]; y_train = y_idx[train_idx]
    X_test = X[test_idx]; y_test = y_idx[test_idx]
    print(f"Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")

    print("Training model...")
    model = train_model(X_train, y_train, X_val=X_test, y_val=y_test, hidden_dim=128,
                        epochs=30, batch_size=128, lr=0.06, weight_decay=1e-5)

    # evaluate final
    preds = model.predict(X_test)
    acc = float(np.mean(preds == y_test))
    print(f"Final test accuracy: {acc:.4f}")

    # pick a few random test users to show recommendations
    sample_users = [users[i] for i in np.random.choice(test_idx, size=5, replace=False)]
    for u in sample_users:
        rec = recommend_for_user(u, model, inv_map, exercises, diets)
        print("\nUSER:", {k: u[k] for k in ('id', 'age','sex','height_cm','weight_kg','bmi','activity_level','diet_pref')})
        print("Predicted goal:", rec['predicted_goal'])
        print("Top 5 exercise recommendations (name - type - cal30 - difficulty):")
        for ex in rec['top_exercises'][:5]:
            print(f"  - {ex['name']} ({ex['type']}) cal30:{ex['cal30']} diff:{ex['difficulty']}")
        print("Top diet recommendations:")
        for d in rec['top_diets']:
            print(f"  - {d['name']} ({d['preference']}) {d['calories']} kcal")

    # Export data optionally
    export_to_csv_items(exercises, 'exercises_catalog.csv')
    export_to_csv_items(diets, 'diet_catalog.csv')
    export_to_csv_items(users[:500], 'synthetic_users_sample.csv')  # sample export

    return {
        "model": model,
        "inv_map": inv_map,
        "exercises": exercises,
        "diets": diets,
        "users": users
    }

# ---------------------------
# CLI / Interactive helpers
# ---------------------------
def simple_cli_loop(state):
    model = state['model']
    inv_map = state['inv_map']
    exercises = state['exercises']
    diets = state['diets']
    users = state['users']

    print("\n=== Simple CLI Demo ===")
    print("Enter user details to get a recommendation. Type 'exit' to quit.")
    while True:
        try:
            age = input("Age (e.g., 28): ")
            if age.strip().lower() == 'exit':
                break
            age = int(age)
            sex = input("Sex (male/female/other) [male]: ") or "male"
            height_cm = float(input("Height in cm (e.g., 172): "))
            weight_kg = float(input("Weight in kg (e.g., 70): "))
            activity_level = input(f"Activity level {ACTIVITY_LEVELS} [moderate]: ") or "moderate"
            diet_pref = input(f"Diet preference {DIET_PREFERENCES} [omnivore]: ") or "omnivore"
            strength = int(input("Estimated strength (0-100) [50]: ") or "50")
            endurance = int(input("Estimated endurance (0-100) [50]: ") or "50")
        except Exception as e:
            print("Invalid input, try again.", str(e))
            continue
        user = {
            "id": "CLI-USER",
            "age": age,
            "sex": sex,
            "height_cm": height_cm,
            "weight_kg": weight_kg,
            "bmi": round(body_mass_index(weight_kg, height_cm), 2),
            "activity_level": activity_level if activity_level in ACTIVITY_LEVELS else "moderate",
            "diet_pref": diet_pref if diet_pref in DIET_PREFERENCES else "omnivore",
            "strength": strength,
            "endurance": endurance
        }
        rec = recommend_for_user(user, model, inv_map, exercises, diets)
        print("\nPredicted goal:", rec['predicted_goal'])
        print("Top recommended exercises:")
        for ex in rec['top_exercises'][:10]:
            print(f" - {ex['name']} ({ex['type']}) [{ex['duration']}min] cal30:{ex['cal30']} diff:{ex['difficulty']}")
        print("Top recommended diets:")
        for d in rec['top_diets']:
            print(f" - {d['name']} [{d['preference']}] {d['calories']} kcal")
        print("\n---\n")

# ---------------------------
# Expanders - programmatically create more content if needed
# ---------------------------
def auto_expand_exercises(existing_exercises: List[Dict], target_total: int):
    """
    If you truly want 2000+ lines or even more entries, call this function to duplicate and variant-create
    more exercises programmatically and append to the existing list.
    """
    if len(existing_exercises) >= target_total:
        return existing_exercises
    i = len(existing_exercises) + 1
    while len(existing_exercises) < target_total:
        base = random.choice(existing_exercises)
        name = base['name'] + " Variant " + str(random.randint(1, 99))
        ex = {
            "id": f"EX{i:05d}",
            "name": name,
            "type": random.choice(EXERCISE_TYPES),
            "muscle": random.choice(MUSCLE_GROUPS),
            "difficulty": int(np.clip(base['difficulty'] + random.randint(-1,1), 1, 5)),
            "cal30": int(np.clip(base['cal30'] * np.random.uniform(0.8, 1.2), 50, 900)),
            "equipment": base.get('equipment', None),
            "duration": int(np.clip(base['duration'] * np.random.choice([1,1,1.25,0.75]), 5, 90)),
            "description": base.get('description', "") + " (variant)"
        }
        existing_exercises.append(ex)
        i += 1
    return existing_exercises

def auto_expand_diets(existing_diets: List[Dict], target_total: int):
    """
    Programmatically create more diet plans via small variations.
    """
    if len(existing_diets) >= target_total:
        return existing_diets
    i = len(existing_diets) + 1
    while len(existing_diets) < target_total:
        base = random.choice(existing_diets)
        cal = int(np.clip(base['calories'] * np.random.uniform(0.85, 1.15), 1000, 4000))
        prot = int(np.clip(base['protein_g'] * np.random.uniform(0.8, 1.2), 5, 400))
        carbs = int(np.clip(base['carbs_g'] * np.random.uniform(0.8, 1.2), 0, 800))
        fat = int(np.clip(base['fat_g'] * np.random.uniform(0.8, 1.2), 0, 400))
        meals = base.get('meals', [])
        # tweak meals
        meals_variant = meals.copy()
        if meals_variant:
            idx_to_change = random.randrange(len(meals_variant))
            meals_variant[idx_to_change] = meals_variant[idx_to_change] + " (variant)"
        diet = {
            "id": f"DI{i:05d}",
            "name": base['name'] + " Variant",
            "preference": base['preference'],
            "calories": cal,
            "protein_g": prot,
            "carbs_g": carbs,
            "fat_g": fat,
            "meals": meals_variant,
            "description": base.get('description', "") + " (variant)"
        }
        existing_diets.append(diet)
        i += 1
    return existing_diets

# ---------------------------
# Main entrypoint
# ---------------------------
if __name__ == "__main__":
    print("Fitness Recommender (NumPy) - starting demo...")
    state = build_and_train_demo()

    # Optionally expand catalogs to larger sizes (uncomment to auto-expand)
    # print("Auto-expanding exercise catalog to 3000 items...")
    # state['exercises'] = auto_expand_exercises(state['exercises'], 3000)
    # print("Auto-expanding diet catalog to 3000 items...")
    # state['diets'] = auto_expand_diets(state['diets'], 3000)
    # export_to_csv_items(state['exercises'], 'exercises_catalog_big.csv')
    # export_to_csv_items(state['diets'], 'diet_catalog_big.csv')

    # Launch CLI (comment out to avoid interactive mode)
    try:
        simple_cli_loop(state)
    except KeyboardInterrupt:
        print("\nExiting demo. Goodbye.")
