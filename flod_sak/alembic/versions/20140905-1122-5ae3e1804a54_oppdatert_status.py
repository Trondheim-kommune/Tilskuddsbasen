# -*- coding: utf-8 -*-
"""oppdatert status

Revision ID: 5ae3e1804a54
Revises: 31679773865a
Create Date: 2014-09-05 11:22:10.207673

"""

# revision identifiers, used by Alembic.
revision = '5ae3e1804a54'
down_revision = '31679773865a'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM


def upgrade():
    op.drop_column('soknader', 'status')
    ENUM(name="soknad_status_types").drop(op.get_bind(), checkfirst=False)
    new_status_enum = sa.Enum('Kladd',
            'Innsendt',
            'Trukket',
            'Avsluttet',
            'Under behandling',
            'Etterspurt info',
            'Til vedtak',
            'Vedtak fattet',
            u'Vedtak påklaget',
            'Til utbetaling',
            'Avventer rapport',
            'Rapport levert',
            'Rapport underkjent',
            'Tilbakebetaling kreves', name='soknad_status_types')
    new_status_enum.create(op.get_bind())
    op.add_column('soknader', sa.Column('status', new_status_enum, nullable=True))

def downgrade():
    op.drop_column('soknader', 'status')
    ENUM(name="soknad_status_types").drop(op.get_bind(), checkfirst=False)
    old_status_enum = sa.Enum('Kladd', 'Innlevert', 'Trukket', 'Godkjent', u'Avslått', name='soknad_status_types')
    old_status_enum.create(op.get_bind())
    op.add_column('soknader', sa.Column('status', old_status_enum, nullable=True))
