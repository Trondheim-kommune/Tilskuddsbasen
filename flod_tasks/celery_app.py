# -*- coding: utf-8 -*-

from celery import Celery


def create_celery_app():
    # Here we are instantiating a Celery object and handing it a
    # list containing the relative (to where you start your Celery daemon)
    # path to all modules containing Celery tasks.
    celery_app = Celery('app', include=['celery_tasks.email_tasks',
                                        'celery_tasks.reminder_tasks',
                                        'celery_tasks.arkiv_tasks'])

    # Import Celery config file
    celery_app.config_from_object('celeryconfig')

    # WARN: to remote debug celery you have to remember that celery spawns several processes depending on your
    # configuration. Each of this process will attempt to connect to a remote debugger, which means that your will
    # probably have to fire them manually.
    # For each worker you need to start:
    #  * modify the port kwarg in the code under
    #  * start a remote debugger listening on this port
    #  * start the worker.
    #import pydevd
    #pydevd.settrace("10.0.2.2", port=7777, suspend=False, stdoutToServer=True, stderrToServer=True)

    return celery_app


app = create_celery_app()


if __name__ == '__main__':
    app.start()
