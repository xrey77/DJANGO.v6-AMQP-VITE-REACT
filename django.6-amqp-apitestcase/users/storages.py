from django.core.files.storage import Storage
from django.conf import settings

class NoOpStorage(Storage):
    def _save(self, name, content):
        return name

    def _open(self, name, mode='rb'):
        raise NotImplementedError("This storage does not support opening files.")

    def delete(self, name):
        pass

    def exists(self, name):
        return False

    def listdir(self, path):
        return ([], [])

    def size(self, name):
        return 0

    def url(self, name):
        return f"{settings.MEDIA_URL}{name}"

    def get_accessed_time(self, name):
        pass

    def get_created_time(self, name):
        pass

    def get_modified_time(self, name):
        pass
