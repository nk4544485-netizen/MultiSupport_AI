import os
import json
from dotenv import load_dotenv

load_dotenv()

class MockCursor:
    def __init__(self, items):
        self.items = items

    def sort(self, key, direction=-1):
        try:
            self.items.sort(key=lambda x: x.get(key, ""), reverse=(direction == -1))
        except Exception:
            pass
        return self

    def skip(self, n):
        self.items = self.items[n:]
        return self

    def limit(self, n):
        if n > 0:
            self.items = self.items[:n]
        return self

    def __iter__(self):
        return iter(self.items)

    def __next__(self):
        return next(self.items)

    def __len__(self):
        return len(self.items)


class MockCollection:
    def __init__(self, name):
        self.name = name
        self.file_dir = os.path.join(os.path.dirname(__file__), "mock_data")
        os.makedirs(self.file_dir, exist_ok=True)
        self.file_path = os.path.join(self.file_dir, f"mock_{name}.json")
        if not os.path.exists(self.file_path):
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _read(self):
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write(self, data):
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, default=str, indent=2)
        except Exception as e:
            print(f"Error writing mock collection {self.name}: {e}")

    def find_one(self, filter, projection=None):
        data = self._read()
        for item in data:
            match = True
            for k, v in filter.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                if projection and "_id" in projection and projection["_id"] == 0:
                    item_copy = item.copy()
                    item_copy.pop("_id", None)
                    return item_copy
                return item
        return None

    def insert_one(self, document):
        data = self._read()
        if "_id" not in document:
            document["_id"] = f"mock_{len(data) + 1}"
        data.append(document)
        self._write(data)
        return document

    def find(self, filter=None, projection=None):
        data = self._read()
        results = []
        filter = filter or {}
        for item in data:
            match = True
            for k, v in filter.items():
                if k == "$or":
                    or_match = False
                    for or_cond in v:
                        cond_match = True
                        for ok, ov in or_cond.items():
                            if isinstance(ov, dict) and "$regex" in ov:
                                reg = ov["$regex"]
                                val = item.get(ok, "")
                                if isinstance(val, str) and reg.lower() in val.lower():
                                    pass
                                else:
                                    cond_match = False
                            else:
                                if item.get(ok) != ov:
                                    cond_match = False
                        if cond_match:
                            or_match = True
                            break
                    if not or_match:
                        match = False
                elif isinstance(v, dict) and "$regex" in v:
                    reg = v["$regex"]
                    val = item.get(k, "")
                    if isinstance(val, str) and reg.lower() in val.lower():
                        pass
                    else:
                        match = False
                else:
                    if item.get(k) != v:
                        match = False
                        break
            if match:
                res_item = item.copy()
                if projection and "_id" in projection and projection["_id"] == 0:
                    res_item.pop("_id", None)
                results.append(res_item)
        return MockCursor(results)

    def update_one(self, filter, update):
        data = self._read()
        updated = False
        for item in data:
            match = True
            for k, v in filter.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                if "$set" in update:
                    for uk, uv in update["$set"].items():
                        item[uk] = uv
                    updated = True
                    break
        if updated:
            self._write(data)
        class MockUpdateResult:
            matched_count = 1 if updated else 0
            modified_count = 1 if updated else 0
        return MockUpdateResult()

    def delete_one(self, filter):
        data = self._read()
        deleted = False
        for i, item in enumerate(data):
            match = True
            for k, v in filter.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                data.pop(i)
                deleted = True
                break
        if deleted:
            self._write(data)
        class MockDeleteResult:
            deleted_count = 1 if deleted else 0
        return MockDeleteResult()

    def delete_many(self, filter):
        data = self._read()
        initial_len = len(data)
        new_data = []
        for item in data:
            match = True
            for k, v in filter.items():
                if item.get(k) != v:
                    match = False
                    break
            if not match:
                new_data.append(item)
        self._write(new_data)
        class MockDeleteResult:
            deleted_count = initial_len - len(new_data)
        return MockDeleteResult()

    def count_documents(self, filter):
        data = self._read()
        count = 0
        for item in data:
            match = True
            for k, v in filter.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                count += 1
        return count


class MockDatabase:
    def __getitem__(self, name):
        return MockCollection(name)


print("[OK] MongoDB Connected Successfully! (Self-Contained Mock Database Mode)")

db = MockDatabase()

users = db["users"]
chat_history = db["chat_history"]
tickets = db["tickets"]
conversations = db["conversations"]