# -*- coding: utf-8 -*-
"""ny status rapport_pabegynt

Revision ID: 3755365cd7d4
Revises: 101b3a146ac1
Create Date: 2014-09-16 11:05:08.010752

"""

# revision identifiers, used by Alembic.
from sqlalchemy.dialects.postgresql import ENUM

revision = '3755365cd7d4'
down_revision = '101b3a146ac1'

from alembic import op
import sqlalchemy as sa


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
                              u'Rapport påbegynt',
                              'Rapport levert',
                              'Rapport underkjent',
                              'Tilbakebetaling kreves', name='soknad_status_types')
    new_status_enum.create(op.get_bind())
    op.add_column('soknader', sa.Column('status', new_status_enum, nullable=True))


def downgrade():
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